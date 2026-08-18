# 账号页功能补全

> 状态：📋 计划阶段
> 创建：2026-08-18

---

## 一、目标

补齐账号页缺少的 5 项功能，使页面达到行业标准。

## 二、文件清单

### 新建文件

| # | 文件 | 说明 | 状态 |
|---|------|------|------|
| 1 | `apps/web/src/app/api/user/profile/route.ts` | GET 用户完整资料（含 OAuth 账号列表） | [ ] |
| 2 | `apps/web/src/app/api/user/update/route.ts` | POST 修改名字 | [ ] |

### 修改文件

| # | 文件 | 改什么 | 状态 |
|---|------|--------|------|
| 3 | `apps/web/src/app/[locale]/account/AccountClient.tsx` | 大改：加注册时间、邮箱验证、OAuth、最近收藏、修改密码、修改名字 | [ ] |
| 4 | `shared/messages/{en,zh-CN,zh-TW,ja}.json` | 新增翻译 key | [ ] |

### 无需改动

- 修改密码：已有 `set-password` API，直接复用，加一个前端弹窗即可
- 已有 API 够用，不需要新建数据库字段

---

## 三、API 设计

### GET /api/user/profile

返回当前登录用户完整资料：

```json
{
  "user": {
    "id": "xxx",
    "email": "user@example.com",
    "emailVerified": "2026-01-15T00:00:00Z",  // null 表示未验证
    "name": "User",
    "role": "user",
    "image": "https://...",
    "createdAt": "2026-01-15T00:00:00Z",
    "hasPassword": true,  // 是否有密码（可修改密码）
    "accounts": [
      { "provider": "google" },
      { "provider": "github" }
    ]
  }
}
```

### POST /api/user/update

```json
// 请求
{ "name": "新名字" }
// 响应
{ "ok": true }
```

---

## 四、UI 设计

### 账号页最终布局

```
┌─ 用户信息卡 ─────────────────────────────┐
│ 头像 名字            [退出] [修改名字]    │
│      邮箱 ✓ 已验证                        │
│      👤 用户 · 2026年1月加入             │
│      🔗 Google 已绑定                     │
│      🔒 密码登录  [修改密码]              │
└───────────────────────────────────────────┘

┌─ 最近收藏 ───────────────────────────────┐
│ 最近收藏的 3 个（横排小卡片，可点击）     │
│  [🔐 base64] [📋 json-formatter] [🔗 url-encode] │
└───────────────────────────────────────────┘

┌─ 统计卡片 ───────────────────────────────┐
│ 收藏总数 3 │ 工具 1 │ 产品 2 │
└───────────────────────────────────────────┘

┌─ 收藏列表 ───────────────────────────────┐
│ [全部(3)] [🔧 工具(1)] [📦 产品(2)]     │
│ 🍳 CookMate  📦 产品 · 8月2日  [查看] [✕]│
│ ...                                      │
└───────────────────────────────────────────┘
```

---

## 五、翻译 Key（4 语言同步）

| key | 位置 | en | zh-CN |
|-----|------|----|-------|
| `memberSince` | auth | Member since | 加入时间 |
| `emailUnverified` | auth | Not verified | 未验证 |
| `emailVerified` | auth | (已有) | (已有) |
| `connectedAccounts` | auth | Connected accounts | 绑定账号 |
| `passwordLogin` | auth | Password login | 密码登录 |
| `changePassword` | auth | Change password | 修改密码 |
| `editName` | auth | Edit name | 修改名字 |
| `save` | auth | Save | 保存 |
| `cancel` | auth | Cancel | 取消 |
| `nameUpdated` | auth | Name updated | 名字已更新 |
| `recentFavorites` | tools | Recent Favorites | 最近收藏 |

---

## 六、执行顺序

1. 新建 `GET /api/user/profile` 路由（#1）
2. 新建 `POST /api/user/update` 路由（#2）
3. AccountClient 大改：用户信息卡增加注册时间/邮箱验证/OAuth/密码/修改名字（#3）
4. AccountClient 加最近收藏区（#3）
5. 修改密码弹窗（#3）
6. 翻译 key 4 语言（#4）
7. 验证：typecheck + test + lint + build