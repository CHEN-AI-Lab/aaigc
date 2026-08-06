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
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

const providers = []

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

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash) return null

      const bcrypt = await import("bcryptjs")
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return null

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
      // OAuth 首次登录时，设置默认 role
      if (account?.type === "oauth" && user.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          })
          if (dbUser && !dbUser.role) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "user" },
            })
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
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider
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