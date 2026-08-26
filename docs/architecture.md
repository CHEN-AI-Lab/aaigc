# AAIGC — 项目架构设计

> 通用架构文档请见：`/home/ubuntu/workspace/.shared/architecture/usage-tracking.md`
> 本文档仅记录 AAIGC 项目的具体配置和实现细节。

---

## 一、项目配置

| 配置项 | 值 |
|--------|-----|
| 项目标识（project） | `aaigc` |
| Cloudflare Worker 地址 | 待部署 |
| Turso (libSQL) 数据库 | 统计 Worker 使用，见 stats-worker 部署文档 |
| Neon Postgres 连接串 | 待注册 |
| 工具数量 | 38 个 |
| 首页展示新工具数 | 4 个 |
| 首页展示热门工具数 | 12 个 |

## 二、前端埋点位置

| 页面 | 文件 | 说明 |
|------|------|------|
| 所有页面 | `apps/web/src/app/[locale]/layout.tsx` | 全局统计，记录页面访问 |
| 工具详情页 | `apps/web/src/components/ToolPageClient.tsx` | 额外传 tool 和 type='tool' |

## 三、工具数据

`data/tools.ts` 中的 `ToolMeta` 需要加 `createdAt` 字段：

```typescript
export interface ToolMeta {
  id: string
  category: ToolCategoryId
  icon: string
  component: string
  createdAt: string   // 格式：'YYYY-MM-DD'
  npmDeps?: string[]
}
```

## 四、实现状态

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 5 | 访问统计 + 首页排行榜 | ✅ 代码完成（待部署 Worker） |
| Phase 6 | 用户系统 | 📅 待定 |
| Phase 7 | 收藏 + 点赞 | 📅 待定 |
| Phase 8 | 评论系统 | 📅 待定 |
| Phase 9 | 个性化推荐 | 📅 待定 |