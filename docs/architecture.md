# AAIGC — 项目架构设计

> 通用架构文档请见：`/home/ubuntu/workspace/.shared/architecture/usage-tracking.md`
> 本文档仅记录 AAIGC 项目的具体配置和实现细节。

---

## 一、项目配置

| 配置项 | 值 |
|--------|-----|
| 项目标识（project） | `aaigc` |
| Cloudflare Worker 地址 | https://stats.aaigc.workers.dev（已部署） |
| Turso (libSQL) 数据库 | 统计 Worker 使用，见 stats-worker 部署文档 |
| Neon Postgres 连接串 | 已配置（用户系统 / 收藏 / 评论） |
| 工具数量 | 38 个 |
| 首页展示新工具数 | 4 个 |
| 首页展示热门工具数 | 12 个 |

## 二、端清单

| 端 | 路径 | 框架 | shared 接入 | 状态 |
|---|---|---|---|---|
| Web | `apps/web/` | Next.js 16 App Router | TS 直接 import | ✅ 主端 |
| 小程序 | `apps/weapp/` | Taro v4 + React | TS 直接 import | ✅ 已接入（Taro 一码编译多平台） |
| 手机 App | `apps/app/` | React Native Expo | TS 直接 import | ✅ 已接入 |
| 桌面端 | `apps/desktop/` | Tauri + Vite + React | vite.config.ts 构建期注入 | ✅ 已接入 |
| CLI | `apps/cli/` | Node + TypeScript | TS 直接 import | ✅ 已接入 |

> ⚠️ **快应用端已从项目框架中移除**（生态衰退、覆盖用户极小）。
> ⚠️ **鸿蒙 App 端**待商业决策：HarmonyOS NEXT（API 12+）剔除 AOSP，与 Expo App 不通用，需用 ArkTS / ArkUI 重写 UI（shared/ 层可完全复用）。

## 三、前端埋点位置

| 端 | 入口 | 文件 | 说明 |
|---|---|---|---|
| Web（所有页面） | 全局 layout | `apps/web/src/app/[locale]/layout.tsx` → `<VisitTracker />` | 调 `useVisitTracking('aaigc', pathname)` |
| Web（工具详情页） | 工具客户端 | `apps/web/src/components/ToolPageClient.tsx` | 额外传 tool + type='tool' |
| Web hook 实现 | 端专用 | `apps/web/src/hooks/useVisitTracking.ts` | 仅 web 端用（依赖 localStorage/crypto/navigator），**已从 shared/hooks/ 挪出** |
| 小程序 | Taro runtime | `apps/weapp/src/runtime/` | 自实现轻量埋点（同 Worker URL + Fallback URL） |
| App | RN runtime | `apps/app/src/runtime/` | 同上 |
| 桌面端 | 构建期常量 | `apps/desktop/src/shell/` | 走构建期常量注入的 fetch |
| CLI | `telemetry.ts` | `apps/cli/src/core/telemetry.ts` | 默认关闭，受 `AAIGC_TELEMETRY` 控制 |

## 四、工具数据

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

## 五、实现状态

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1-4 | 工具集合 + 首页 | ✅ |
| Phase 5 | 访问统计 + 首页排行榜 | ✅ Worker 已部署 |
| Phase 6 | 用户系统（邮箱验证码 / OAuth / 账号管理） | ✅ |
| Phase 7 | 收藏 + 点赞 | ✅ |
| Phase 8 | 评论系统 | 📅 待定 |
| Phase 9 | 个性化推荐 | 📅 待定 |

## 六、Harness 骨架完整性（2026-09-30 审计）

| 项 | 状态 |
|---|---|
| 5 端 monorepo 骨架 | ✅ |
| shared/ exports 通配符 | ✅ 11 项 |
| 4 语言翻译对齐（en/zh-CN/zh-TW/ja） | ✅ 1682 keys |
| scripts/check.sh 全套门禁 | ✅（结构 + 迁移 + i18n + 桌面语言 + J-8 + 切片 + 翻译 + lint + tsc + test + build + weapp bundle） |
| BrowserCompatGate（旧浏览器兼容提示，Hard Rule 1.4） | ✅ 已补 |
| test-pages/ 列入 .gitignore（Hard Rule 1.3） | ✅ 已补 |
| 端专用 hook 移到 apps/web/src/hooks/（G-2） | ✅ useVisitTracking |
| pre-commit 钩子（结构 + tsc + lint + test + i18n + J-8 + 迁移 + 翻译） | ✅ |