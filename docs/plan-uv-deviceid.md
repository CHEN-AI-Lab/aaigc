# UV 统计改用设备 UUID + 登录用户数统计

## 现状

- UV 统计：按 IP 去重（`INSERT OR IGNORE INTO daily_uv (project, date, ip)`）
- 问题：多用户共享一个 IP 时只算 1 个 UV
- 前端发统计时没有传设备标识
- 没有登录用户数统计

## 改动计划

### 前提：测试数据库旧数据全部删除

直接在 Turso 测试库删掉 `daily_uv` 和 `total_uv` 两张表重建，旧数据不要了。

### 第一步：前端（aaigc 项目）

**文件**：`shared/hooks/useVisitTracking.ts`

改动：
1. 加 `getDeviceId()` 函数——localStorage 存一个 UUID，存一次永远不变
2. 请求体加上 `deviceId` 字段

```typescript
function getDeviceId(): string {
  let id: string | null = null
  if (typeof window !== 'undefined') {
    id = localStorage.getItem('_did')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('_did', id)
    }
  }
  return id || 'unknown'
}
```

请求体：`{ project, page, tool, userId, deviceId, env }`

### 第二步：Worker（stats-worker 项目）

**文件**：`worker.js`

改动 1（第 151 行）：接收 `deviceId`

```javascript
const { project, page, tool, userId, deviceId, env: envParam } = body
```

改动 2（第 219-229 行）：UV 表改用 `device_id` 代替 `ip`，唯一约束也对应改

```javascript
const device = deviceId || geo.ip
// 每日 UV
statements.push({
  sql: `INSERT OR IGNORE INTO daily_uv (project, date, device_id) VALUES (?, ?, ?)`,
  args: [project, dk, device],
})
// 累计 UV
statements.push({
  sql: `INSERT OR IGNORE INTO total_uv (project, device_id) VALUES (?, ?)`,
  args: [project, device],
})
```

改动 3：新增登录用户数统计，在 tool 或 page 写入后，判断 `userId` 是否存在

```javascript
// 如果用户已登录，记录登录用户数
if (userId) {
  statements.push({
    sql: `INSERT OR IGNORE INTO login_uv (project, date, user_id) VALUES (?, ?, ?)`,
    args: [project, dk, userId],
  })
}
```

### 第三步：Turso 测试数据库表重建

删掉旧表，按新结构重建：

```sql
DROP TABLE IF EXISTS daily_uv;
DROP TABLE IF EXISTS total_uv;

CREATE TABLE daily_uv (
  project TEXT NOT NULL,
  date TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT '',
  UNIQUE(project, date, device_id)
);

CREATE TABLE total_uv (
  project TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT '',
  UNIQUE(project, device_id)
);

CREATE TABLE login_uv (
  project TEXT NOT NULL,
  date TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  UNIQUE(project, date, user_id)
);
```

### 第四步：统计面板（stats-dashboard 项目）

**不改现有 UV 查询逻辑**——`SELECT COUNT(*) FROM daily_uv` 语句不变，只是存的值的含义变了。

**新增一栏显示登录用户数：**

在显示 UV 的地方旁边加一行，读 `login_uv` 表：

```sql
SELECT COUNT(*) FROM login_uv WHERE project=? AND date=?
```

## 涉及的项目

| 项目 | 路径 | 改动量 |
|------|------|--------|
| aaigc | `shared/hooks/useVisitTracking.ts` | 加 10 行 |
| stats-worker | `worker.js` | 改 8 行 |
| Turso 测试库 | 删表重建 | 3 张表 |
| stats-dashboard | 统计面板加一栏 | 加 1 个查询 + 显示 |

## 验证清单

- [ ] 前端 localStorage 生成 UUID
- [ ] 统计请求带了 `deviceId`
- [ ] Worker 收到 `deviceId` 并写入 `daily_uv.device_id`
- [ ] Worker 收到 `userId` 时写入 `login_uv`
- [ ] 统计面板 UV 正常
- [ ] 统计面板显示登录用户数