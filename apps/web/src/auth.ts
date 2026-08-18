import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface JWT {
    role: string
  }
}

import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "shared/utils/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { checkLoginRateLimit, recordLoginAttempt } from "shared/utils/login-rate-limit"

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
      const email = credentials?.email as string
      const code = credentials?.code as string
      if (!email || !code) return null

      const verification = await prisma.verificationCode.findFirst({
        where: { email, code, used: false, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      })
      if (!verification) return null

      // Mark as used
      await prisma.verificationCode.update({
        where: { id: verification.id },
        data: { used: true },
      })

      // Find or create user
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return null

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
      const email = credentials?.email as string
      const password = credentials?.password as string

      if (!email || !password) return null

      // Rate limit check
      const rateKey = `login:${(email || '').toLowerCase()}`
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
      allowDangerousEmailAccountLinking: true,
    })
  )
}

// GitHub — 仅当配置了凭证时才启用
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

const { handlers: nextAuthHandlers, auth: nextAuthAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === "oauth" && user.id) {
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
  },
})

export { signIn, signOut }
export const handlers = nextAuthHandlers
export const auth = nextAuthAuth