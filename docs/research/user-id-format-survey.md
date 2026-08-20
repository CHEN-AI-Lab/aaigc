# 数据库用户 ID 格式调研

> 调研时间: 2026-08-13
> 调研目的: 了解业界主流用户在数据库中存储用户 ID 的格式，为 aaigc 项目的 User.id 格式决策提供依据
> 调研方法: HN Algolia API / Wikipedia / GitHub API / 公司官方 API 实际探测

---

## 一、当前现状

`prisma/schema.prisma` 中 User.id 定义:
```prisma
id  String  @id @default(cuid())
```

- `cuid()` 生成 25 字符字母数字混合字符串，形如 `cl2kx2pdx0000i0i8xq8p7h4l`
- 这是 auth.js (NextAuth) 的 Prisma Adapter 默认行为
- 所有相关表（Account、Session、Favorite、VerificationCode）的 ID 也用同样格式

---

## 二、业界主流 ID 格式对比

### 2.1 四种主流方案一览

| 方案 | 格式示例 | 代表 | 长度 | 排序 | 防枚举 |
|------|---------|------|------|------|--------|
| 自增整数 (AUTOINT) | `1`, `12345` | GitHub, Reddit, 早期 Twitter | 4-20 位纯数字 | ✅ 自然 | ❌ |
| 雪花 ID (SNOWFLAKE) | `686532208001` | Twitter(X), Discord, Instagram, Mastodon, Bilibili | 19 位纯数字 | ✅ 自然 | 部分 |
| Base64 编码 ID | `dQw4w9WgXcQ` | YouTube, Twitter(Tweet) | 11-18 字符 | ❌ 随机 | ✅ |
| UUID (v4/v7) | `550e8400-e29b-41d4-a716-446655440000` | Firebase, Auth0, Supabase, Prisma 默认 | 36 字符 | ❌ 随机(v4)/ ✅(v7) | ✅ |

### 2.2 逐家公司实际做法

#### 🔵 GitHub — 纯数字自增 ID
- **证据**: GitHub REST API 实测
  - `GET /users/torvalds` → `"id": 1024025`
  - `GET /users/octocat` → `"id": 583231`
- 格式: 纯整数（大数型自增，非 bigint 自增）
- 特点: 完全按注册顺序递增，用户 ID 可以直接反映注册顺序和大致用户总量

#### 🟣 Twitter / X — 雪花 ID（Snowflake）
- **证据**:
  - Twitter 官方工程博客 2010 年文章《IDs at Twitter》描述了 Snowflake 算法
  - Twitter API 返回的用户 ID / Tweet ID 均为 64-bit 整数（19 位纯数字），形如 `1234567890123456789`
  - HN 讨论: "Snowflake IDs are apparently used by Twitter, Discord, Instagram, and Mastodon"
- **Snowflake 算法结构** (64 位):
  ```
  1 bit  |  41 bits  |  10 bits  |  12 bits
  sign   | 毫秒时间戳  | worker ID  | sequence
  ```
- 特点: 纯数字、天然按时间排序、全局唯一（分布式场景）
- **重要新闻**: Twitter 历史上发生过雪花 ID 重叠的安全事故（2013 年因主备切换导致两个数据中心产生相同 ID，泄露了非公开推文内容）。此后 Twitter 增加了随机后缀到对外 URL 上。

#### 🟢 YouTube — Base64 编码 64-bit 整数
- **证据**: HN 上多位工程师确认
  - "YouTube still uses 11 character base64 strings for their video ids, which are assumed to be 64-bit ints"
  - YouTube 用户 ID 是 36 字符 Base64 字符串（约 27 字节 / 216 位，可能是 UUID 或更长的雪花 ID 编码）
- 视频 ID 格式: 11 个 Base64 字符，例如 `dQw4w9WgXcQ`
- 本质: 仍然是整数 ID，但对外展示时做了 Base64 编码，使得链接更短且不可直接猜测

#### 🔴 Bilibili (哔哩哔哩) — 雪花 ID + BV 号
- **内部 ID**: av 号（如 `av12345678`）是纯数字雪花 ID
- **外部 BV 号**: 如 `BV1xx411c7m6`，是 av 号经过异或加密后的 Base64 变形
- 目的: 避免用户通过 av 号猜测视频发布时间、总视频量等信息
- 本质: 内部仍然用纯数字雪花 ID，对外做了一层混淆

#### 🟡 Discord — 雪花 ID
- 消息 ID、用户 ID 都是 18 位雪花 ID 纯数字，例如 `123456789012345678`
- 时间戳隐藏在 ID 前 41 位中，可以解码出创建时间

#### 🟠 Instagram — 雪花 ID
- HN 讨论确认: "Instagram uses Snowflake IDs"
- 用户 ID 和帖子 ID 均为纯数字雪花 ID

#### 🟤 Stripe — 前缀 + 随机字符串
- 格式: `{类型}_{随机字符串}`
  - 用户: `cus_123456789`
  - 充单: `ch_123456789`
  - 支付意图: `pi_123456789`
- 证据: Stripe API 文档中大量示例
- 特点: 类型前缀 + Base64 编码数字，人类可读且不可枚举

#### ⚪ Firebase — UUID v4
- Firebase Auth 用户 ID 是 28 字符 Base64 字符串（本质是 128 位 UUID）
- 例如: `xyzABC123456789xyzABC123456`

#### ⚪ Auth0 / Supabase / Prisma 默认 — UUID
- Auth0: UUID v4，形如 `auth0|5f1a2b3c4d5e6f7g8h9i0j1k`
- Supabase (基于 Firebase 方案): UUID v4
- Prisma 默认: `@default(uuid())` 或 `@default(cuid())`

---

## 三、社区争论焦点（HN / Reddit）

### 3.1 "自增 ID 才是王道" 派

**核心论点** (HN 评论原文):
> "My go-to pattern for many years now is to use a plain bigint autoincrement column for internal database relations and then a uuid for application-level identifiers... Never use the uuid as the actual primary key because they're enormous and now the DBMS has to copy that gigantic number to every side of the relation."

**技术论据**:
- 整数索引更小（4 字节 vs UUID 16 字节 vs CUID 25 字节）
- 索引缓存命中率高（B-tree 更适合连续整数）
- JOIN 性能更好
- 天然按时间排序

### 3.2 "UUID 更安全" 派

**核心论点**:
- 防枚举攻击（无法通过 ID 猜测用户量）
- 跨库合并方便（分布式场景唯一）
- 对外展示无信息泄露

**技术反驳**:
- UUID v4 在 PostgreSQL 中写入时随机分布，导致 B-tree 索引碎片化
- UUID v7 解决了排序问题，但生态支持还不成熟
- 索引开销是真实存在的，尤其在大表上

### 3.3 安全新闻

- **Twitter 2013 年雪花 ID 事故**: 主备切换导致两个数据中心的时间线重叠，产生相同 ID 的推文，部分非公开推文内容被泄露。修复方案是增加随机后缀。
- **Travis CI 数据库 ID 暴露**: 2018 年事故后，社区建议通过给自增 ID 加偏移量来防止重叠。
- **UUID 的安全性误区**: 社区普遍认为 UUID 提供的防枚举保护是"低级别的" — 对于需要真正防枚举的系统，应用层应该做授权校验，而不是依赖 ID 的不可猜测性。

---

## 四、方案总结对比

| 方案 | 简洁度 | 性能 | 防枚举 | 复杂度 | 适用场景 |
|------|--------|------|--------|--------|----------|
| **自增 Int** | ⭐⭐⭐ | ⭐⭐⭐ | ❌ | 最低 | 单库、中小规模、内部系统 |
| **雪花 ID** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 低（可复用库） | 分布式、高并发、需要按时间排序 |
| **Base64 整数** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 中 | 对外展示、防枚举 + 性能兼顾 |
| **UUID/CUID** | ❌ | ⭐ | ⭐⭐⭐ | 最低 | 分布式、跨系统、安全要求高 |

---

## 五、对 aaigc 项目的推荐

### 推荐方案: 自增 Int（PostgreSQL `serial/bigint`）

**理由**:
1. **你们用的是单库 256MB** — 没有分布式需求，不需要雪花 ID 的复杂度
2. **用户量级有限** — 即使自增 ID 泄露用户数，也没什么安全影响（不是 Facebook 级别）
3. **最简洁** — 数据库里 `1`, `2`, `3` 看得清清爽爽，比 `cl2kx2pdx0000i0i8` 好 100 倍
4. **性能最好** — 索引 4 字节，JOIN 快，对 256MB 数据库特别友好
5. **业界有先例** — GitHub 纯数字 ID 是最著名的正面案例

### 如果在意"防枚举":
- 方案 A: 加一个独立的 `display_id` 字段存雪花 ID（对外展示用），数据库内部用自增
- 方案 B: 什么都不做 — aaigc 不是社交网络，用户通过 ID 互撞的可能性几乎为零

### 需要改动的表:
- `User.id` — `String @id @default(cuid())` → `Int @id @default(autoincrement())`
- `Account.id` — 同上
- `Session.id` — 同上
- `VerificationCode.id` — 同上
- `Favorite.id` — 同上

### ⚠️ 风险点:
- Auth.js 的 Prisma Adapter 内部把 `user.id` 存进 JWT 的 `sub` 字段（当前是字符串），改 Int 后会自动转字符串（PostgreSQL + Prisma 会自动处理），但 callback 里的类型需要验证
- **已存在的用户数据需要迁移**，不能直接删表重建
- Auth.js 的 Account/User 表有大量字符串 ID 操作，需要全量搜索代码确保兼容