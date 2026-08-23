import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { decode } from "next-auth/jwt"
import { cookies } from "next/headers"
import { AsyncLocalStorage } from "node:async_hooks"
import { prisma } from "shared/utils/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"
import { consumeVerificationCode } from "shared/utils/verification-code"
import { normalizeEmail } from "shared/utils/verification"

const providers = []

// 邮箱验证码登录
providers.push(
  Credentials({
    id: "email",
    name: "邮箱验证码登录",
    credentials: {
      email: { label: "邮箱", type: "text" },
      code: { label: "验证码", type: "text" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email as string ?? '')
      const code = credentials?.code as string
      if (!email || !code) return null

      // 限流：按邮箱计数失败尝试，防止验证码爆破
      const rateKey = `email-code:${email}`
      const rateCheck = checkLoginRateLimit(rateKey)
      if (!rateCheck.allowed) {
        return null
      }

      // 原子消费验证码（用途绑定 login + 并发安全 + 失败计数）
      const ok = await consumeVerificationCode(email, code, 'login')
      if (!ok) {
        recordLoginAttempt(rateKey, false)
        return null
      }
      recordLoginAttempt(rateKey, true)

      // Find or create user, 同时设置 emailVerified（验证码本身就是邮箱验证）
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return null

      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      }

      return { id: user.id, name: user.name, email: user.email!, role: user.role }
    },
  })
)

// 邮箱 + 密码登录
providers.push(
  Credentials({
    id: "password",
    name: "密码登录",
    credentials: {
      email: { label: "邮箱", type: "text" },
      password: { label: "密码", type: "password" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email as string ?? '')
      const password = credentials?.password as string

      if (!email || !password) return null

      // Rate limit check
      const rateKey = `login:${email}`
      const rateCheck = checkLoginRateLimit(rateKey)
      if (!rateCheck.allowed) {
        return null
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash) return null

      const bcrypt = await import("bcryptjs")
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        recordLoginAttempt(rateKey, false)
        return null
      }

      recordLoginAttempt(rateKey, true)
      return { id: user.id, name: user.name, email: user.email!, role: user.role }
    },
  })
)

// Google — 仅当配置了凭证时才启用
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  )
}

// GitHub — 仅当配置了凭证时才启用
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  )
}

// ── 关联账号用的会话读取（核心改造） ──
// 在 OAuth 回调路由里，next/headers 的 cookies() 读不到会话 cookie（catch-all 路由处理器直接吃原始 Request），
// 导致 signIn 回调拦截失败、核心抛出 OAuthAccountNotLinked 后跳登录页。
// 解决：路由层把浏览器发来的原始 Cookie 头注入 AsyncLocalStorage，signIn 回调从这里可靠读取当前会话。

// 存储"本次请求的原始 Cookie 头"的异步上下文
const requestCookieStore = new AsyncLocalStorage<string>()

// 路由层包裹 handlers.GET/POST：把 Cookie 请求头注入当前异步上下文（OAuth 回调会在此上下文内同步触发 signIn 回调）
export function runWithRequestCookie<T>(cookieHeader: string, fn: () => T): T {
  return requestCookieStore.run(cookieHeader, fn)
}

// 解析 Cookie 请求头（name=value; ...）→ 普通对象。值不解码（JWT 为 base64url，无需转义）
function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=")
    if (idx <= 0) continue
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    if (name) out[name] = value
  }
  return out
}

// 从 Cookie 头里取会话 token（含分片拼接）并解码，返回 userId
async function decodeSessionFromCookieHeader(cookieHeader: string): Promise<string | null> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error("[link-account] 缺少 AUTH_SECRET / 缺少 NEXTAUTH_SECRET")
    return null
  }
  try {
    const parsed = parseCookieHeader(cookieHeader)
    const baseNames = ["__Secure-authjs.session-token", "authjs.session-token"]
    for (const base of baseNames) {
      const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const full = parsed[base]
      if (full) {
        const decoded = await decode({ token: full, salt: base, secret })
        if (decoded?.sub) return decoded.sub
      }
      // 分片拼接：__Secure-authjs.session-token.0 / .1 ...
      const indices: number[] = []
      for (const key of Object.keys(parsed)) {
        const m = key.match(new RegExp(`^${escaped}\\.(\\d+)$`))
        if (m) indices.push(Number(m[1]))
      }
      if (indices.length > 0) {
        indices.sort((a, b) => a - b)
        const token = indices.map((i) => parsed[`${base}.${i}`]).join("")
        const decoded = await decode({ token, salt: base, secret })
        if (decoded?.sub) return decoded.sub
      }
    }
  } catch (e) {
    console.error("[link-account] 从请求头解码 session 异常:", e)
  }
  return null
}

// 读取当前登录会话的用户 id（"关联账号"场景判定：已登录用户发起的 OAuth = 关联操作）。
// 优先用 AsyncLocalStorage 里路由层注入的原始 Cookie 头（在 OAuth 回调上下文可靠可读），
// 仅在缺失时回退到 next/headers 的 cookies()。
async function getSessionUserId(): Promise<string | null> {
  const injectedCookie = requestCookieStore.getStore()
  if (injectedCookie !== undefined) {
    const userId = await decodeSessionFromCookieHeader(injectedCookie)
    if (userId) return userId
    // 注入存在但解不出 → 回退 next/headers 兜底一次
  }

  try {
    const cookieStore = await cookies()
    const all = cookieStore.getAll()
    // 找出所有会话 cookie（含可能的分片 __Secure-authjs.session-token.0/.1）
    const sessionCookies = all.filter(
      (c) =>
        c.name === "__Secure-authjs.session-token" ||
        c.name === "authjs.session-token" ||
        /^__?Secure-authjs\.session-token(?:\.\d+)?$/.test(c.name),
    )
    if (sessionCookies.length === 0) {
      console.error("[link-account] 未找到 session cookie，现存 cookie 名:", all.map((c) => c.name))
      return null
    }
    // 逐个基础名（去掉 .N 分片后缀）尝试取得完整 token
    const baseNames = [...new Set(sessionCookies.map((c) => c.name.replace(/\.\d+$/, "")))]
    let token = ""
    let salt = "authjs.session-token"
    for (const base of baseNames) {
      const full = cookieStore.get(base)
      if (full?.value) {
        token = full.value
        salt = base
        break
      }
      const chunks = sessionCookies
        .filter((c) => c.name.startsWith(`${base}.`))
        .sort((a, b) => a.name.localeCompare(b.name))
      if (chunks.length > 0) {
        token = chunks.map((c) => c.value).join("")
        salt = base
        break
      }
    }
    if (!token) {
      console.error("[link-account] 找到 session cookie 但无法取得 token:", sessionCookies.map((c) => c.name))
      return null
    }
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error("[link-account] 缺少 AUTH_SECRET / NEXTAUTH_SECRET")
      return null
    }
    const decoded = await decode({ token, salt, secret })
    if (!decoded?.sub) {
      console.error("[link-account] decode 成功但无 sub，salt:", salt)
      return null
    }
    return decoded.sub
  } catch (e) {
    console.error("[link-account] 读取 session 异常:", e)
    return null
  }
}

const { handlers: nextAuthHandlers, auth: nextAuthAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.type === "oauth" || account?.type === "oidc") {
        // ── 关联模式：已登录用户从设置页发起 OAuth = "关联账号"操作 ──
        // signIn() 本质是登录（会把 session 切到 OAuth 身份甚至新建用户），
        // 真正的关联在这里拦截：返回字符串 = 直接重定向且不签发新 session，当前登录态保持不变
        const currentUserId = await getSessionUserId()
        if (currentUserId) {
          // 该 OAuth 账号是否已被绑定
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })
          if (existingAccount) {
            // 已绑在当前用户身上 → 放行（正常完成登录，session 不变）
            if (existingAccount.userId === currentUserId) return true
            // 绑在别人身上 → 拒绝，不切换登录态
            return `/account?linkError=bound&provider=${account.provider}`
          }
          const email = normalizeEmail(profile?.email ?? user.email ?? "")
          // 无冲突 → 把 OAuth 账号绑到当前用户名下（当前登录态保持不变）
          try {
            await prisma.account.create({
              data: {
                userId: currentUserId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: typeof account.session_state === "string" ? account.session_state : null,
              },
            })
            // 邮箱一致时同步 emailVerified（OAuth 提供方的邮箱默认视为已验证）
            if (email) {
              const me = await prisma.user.findUnique({
                where: { id: currentUserId },
                select: { email: true, emailVerified: true },
              })
              if (me && me.email === email && !me.emailVerified) {
                await prisma.user.update({
                  where: { id: currentUserId },
                  data: { emailVerified: new Date() },
                })
              }
            }
            return `/account?linked=${account.provider}`
          } catch {
            return "/account?linkError=failed"
          }
        }
        // ── 普通登录（无登录态的 OAuth）→ 原逻辑不变 ──
        if (user.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { role: true, email: true, emailVerified: true },
            })
            // OAuth 提供方的邮箱默认视为已验证
            if (dbUser) {
              const updates: Record<string, string | Date> = {};
              if (!dbUser.role) {
                updates.role = "user";
              }
              if (!dbUser.emailVerified && user.email && dbUser.email === user.email) {
                updates.emailVerified = new Date();
              }
              if (Object.keys(updates).length > 0) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: updates,
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, account, trigger, session }) {
      if (account) {
        token.provider = account.provider
      }
      // 客户端 update() 刷新 session 时，把新名字写进 JWT
      if (trigger === 'update' && session?.name) {
        token.name = session.name
      }
      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true },
          })
          if (dbUser) {
            token.role = dbUser.role
          }
        } catch {
          token.role = "user"
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
})

export { signIn, signOut }
export const handlers = nextAuthHandlers
export const auth = nextAuthAuth