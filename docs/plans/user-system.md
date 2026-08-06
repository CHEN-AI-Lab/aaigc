# 用户系统 — Phase 6

> 状态：✅ 代码完成（待注册数据库 + OAuth 凭据后部署）
> 创建：2026-08-06
> 前置条件：注册 Neon 数据库 + Google OAuth 凭据 + GitHub OAuth 凭据

---

## 一、文件清单

### 新建文件

| # | 文件 | 说明 | 状态 |
|---|------|------|------|
| 1 | `prisma/schema.prisma` | Prisma 数据模型（User + Account + Session + VerificationToken） | [x]  ✅ 已完成 |
| 2 | `apps/web/src/lib/prisma.ts` | Prisma 客户端单例 | [x]  ✅ 已完成 |
| 3 | `apps/web/src/lib/auth.ts` | NextAuth 配置（providers, callbacks, adapter） | [x]  ✅ 已完成 |
| 4 | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 | [x]  ✅ 已完成 |
| 5 | `apps/web/src/app/api/auth/register/route.ts` | 注册 API（邮箱+密码创建用户） | [x]  ✅ 已完成 |
| 6 | `apps/web/src/app/[locale]/login/page.tsx` | 登录页（Google/GitHub 按钮 + 密码表单） | [x]  ✅ 已完成 |
| 7 | `apps/web/src/app/[locale]/register/page.tsx` | 注册页（邮箱+密码 + 社交登录） | [x]  ✅ 已完成 |
| 8 | `apps/web/src/app/[locale]/account/page.tsx` | 账号页（用户信息 + 退出登录） | [x]  ✅ 已完成 |
| 9 | `apps/web/src/components/AuthProvider.tsx` | SessionProvider 包裹组件 | [x]  ✅ 已完成 |

### 修改文件

| # | 文件 | 改什么 | 状态 |
|---|------|--------|------|
| 10 | `apps/web/package.json` | 加 next-auth, @auth/prisma-adapter, @prisma/client, prisma, bcryptjs, @types/bcryptjs | [x]  ✅ 已完成 |
| 11 | `apps/web/src/app/[locale]/layout.tsx` | 加 SessionProvider 包裹 | [x]  ✅ 已完成 |
| 12 | `apps/web/src/app/[locale]/stats/page.tsx` | 暂不加 admin 检查，等后期再加 | [ ] |
| 13 | `.env.example` | 加 DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET | [x]  ✅ 已完成 |
| 14 | `shared/messages/en.json` | 加 auth 翻译 key | [x]  ✅ 已完成 |
| 15 | `shared/messages/zh-CN.json` | 加 auth 翻译 key | [x]  ✅ 已完成 |
| 16 | `shared/messages/zh-TW.json` | 加 auth 翻译 key | [x]  ✅ 已完成 |
| 17 | `shared/messages/ja.json` | 加 auth 翻译 key | [x]  ✅ 已完成 |
| 18 | `docs/project-plan.md` | 更新 Phase 6 状态 | [x]  ✅ 已完成 |
| 19 | `apps/web/src/components/Header.tsx` | 加登录/账号入口链接 | [x]  ✅ 已完成 |

---

## 二、数据模型

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(cuid())
  email        String?   @unique
  passwordHash String?              // bcrypt hash，仅密码用户有
  name         String?
  role         String    @default("user")  // "user" | "admin"
  image        String?              // OAuth 头像
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## 三、NextAuth 配置

| 配置项 | 值 |
|--------|-----|
| 适配器 | PrismaAdapter |
| 会话策略 | JWT（不存数据库 session） |
| Providers | Google, GitHub, Credentials（邮箱+密码） |
| JWT 回调 | 注入 `role` 字段 |
| Session 回调 | 注入 `role` 字段 |
| pages | signIn: `/login` |

### Credentials Provider 逻辑

```
authorize(credentials):
  1. 查库找 email 匹配的用户
  2. 没找到 → return null
  3. 没 passwordHash（OAuth 用户）→ return null
  4. bcrypt.compare 密码
  5. 不匹配 → return null
  6. 匹配 → return { id, email, name, role }
```

---

## 四、API 路由

| 路由 | 方法 | 功能 | 返回 |
|------|------|------|------|
| `GET/POST /api/auth/[...nextauth]` | 任意 | NextAuth 处理所有认证流程 | NextAuth 标准 |
| `POST /api/auth/register` | POST | 注册新用户 | `{ success: true }` 或错误 |

### 注册 API 逻辑

```
POST /api/auth/register
Body: { email, password, name }

1. 校验 email 格式 + password >= 8 位
2. 查库 email 是否已存在 → 409
3. bcrypt.hash(password, 10)
4. prisma.user.create({ email, passwordHash, name })
5. return { success: true }
```

---

## 五、前端页面

### 登录页 `/login`

```
┌────────────────────────┐
│    登录                │
│                        │
│  [邮箱]                │
│  [密码]                │
│  [登录]                │
│                        │
│  ─── 或 ───           │
│  [Google 登录]         │
│  [GitHub 登录]         │
│                        │
│  没有账号？[注册]      │
└────────────────────────┘
```

### 注册页 `/register`

```
┌────────────────────────┐
│    注册                │
│                        │
│  [昵称]                │
│  [邮箱]                │
│  [密码]                │
│  [确认密码]            │
│  [注册]                │
│                        │
│  ─── 或 ───           │
│  [Google 注册]         │
│  [GitHub 注册]         │
│                        │
│  已有账号？[登录]      │
└────────────────────────┘
```

### 账号页 `/account`

```
┌────────────────────────┐
│  账号设置              │
│                        │
│  头像   昵称           │
│  邮箱   user@...       │
│  角色   管理员/用户    │
│                        │
│  [退出登录]            │
└────────────────────────┘
```

---

## 六、统计页面鉴权

在 `stats/page.tsx` 中：

```tsx
'use client'
import { useSession } from 'next-auth/react'

export default function StatsPage() {
  const { data: session } = useSession()

  if (session?.user?.role !== 'admin') {
    return <div>无权限访问</div>
  }

  // ... 现有统计页面内容
}
```

---

## 七、翻译 Key

在 `shared/messages/*.json` 的 `auth` 命名空间下新增：

| Key | en | zh-CN |
|-----|----|-------|
| `auth.login` | Login | 登录 |
| `auth.register` | Register | 注册 |
| `auth.logout` | Logout | 退出登录 |
| `auth.email` | Email | 邮箱 |
| `auth.password` | Password | 密码 |
| `auth.confirmPassword` | Confirm Password | 确认密码 |
| `auth.name` | Name | 昵称 |
| `auth.loginButton` | Login | 登录 |
| `auth.registerButton` | Register | 注册 |
| `auth.noAccount` | Don't have an account? | 没有账号？ |
| `auth.hasAccount` | Already have an account? | 已有账号？ |
| `auth.loginWithGoogle` | Sign in with Google | Google 登录 |
| `auth.loginWithGithub` | Sign in with GitHub | GitHub 登录 |
| `auth.unauthorized` | You don't have permission to access this page | 你没有权限访问此页面 |
| `auth.alreadyLoggedIn` | You are already logged in | 您已登录 |
| `auth.goToHome` | Go to Home | 前往首页 |

---

## 八、依赖

```json
// apps/web/package.json 新增
{
  "next-auth": "^5",
  "@auth/prisma-adapter": "^2",
  "@prisma/client": "^6",
  "bcryptjs": "^2",
  "@types/bcryptjs": "^2"
}
// devDependencies
{
  "prisma": "^6"
}
```

---

## 九、环境变量

```
# .env.example 新增
DATABASE_URL=postgresql://user:password@host:port/database
AUTH_SECRET=your-nextauth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

---

## 十、执行顺序

```
1. pnpm add 依赖
2. 写 prisma/schema.prisma
3. 写 apps/web/src/lib/prisma.ts
4. 写 apps/web/src/lib/auth.ts
5. 写 apps/web/src/app/api/auth/[...nextauth]/route.ts
6. 写 apps/web/src/app/api/auth/register/route.ts
7. 写登录/注册/账号页面
8. 写 AuthContext
9. 修改 layout.tsx + stats/page.tsx
10. 更新翻译文件
11. 更新 .env.example
12. 更新 docs/project-plan.md
13. pnpm prisma generate + pnpm build 验证
```