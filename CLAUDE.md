# AAIGC — Project Rules

## Project Overview

AI-powered tools and product portal. 38 free online utilities + 11 product showcases (CookMate, AIHub, Short Drama, Resume Optimizer, CopyCraft, ContentForge, PostForge, Maestro, AI Portfolio Studio, AI Toolbox, Content AI Site).

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router) | |
| Language | TypeScript strict mode | No `any` |
| Styling | Tailwind CSS 4 | Mistral warm color palette |
| i18n | next-intl v4 | 4 languages: en, zh-CN, zh-TW, ja |
| Build | pnpm workspace monorepo | 5 端（web / weapp / app / desktop / cli） |
| Test | Vitest + Playwright | Unit + E2E |
| Deploy | Vercel | Production + Preview |
| Stats | Cloudflare Worker + Turso (libSQL) | Phase 5, Live |

## End Inventory（5 端）

| 端 | 路径 | 框架 | shared 接入 | 备注 |
|---|---|---|---|---|
| Web | `apps/web/` | Next.js 16 + App Router | TS 直接 import | 主端 |
| 小程序 | `apps/weapp/` | Taro v4 + React | TS 直接 import | **一码编译多平台**（微信/支付宝/抖音/百度/QQ/快手等） |
| 手机 App | `apps/app/` | React Native Expo | TS 直接 import | iOS / Android |
| 桌面端 | `apps/desktop/` | Tauri + Vite + React | vite.config.ts 构建期注入 | Windows / macOS / Linux |
| CLI | `apps/cli/` | Node + TypeScript | TS 直接 import | 命令行 |
| 鸿蒙 | `apps/harmony/` | ArkTS + ArkUI | 端内脚本注入 | HarmonyOS NEXT（API 12+），骨架已建 |

> ⚠️ **快应用端已从项目框架中移除**（覆盖用户极小、技术栈已衰退）。
>
> ⚠️ **鸿蒙生态 App**：HarmonyOS NEXT（API 12+）剔除 AOSP，**与 React Native Expo 不通用**。用 ArkTS / ArkUI 写 UI，`shared/` 层完全可复用。`apps/harmony/` **已建骨架**（i18n / favorites / dark mode / hypium 测试），`pnpm setup:harmony` 是建端入口。真机构建与 hypium 测试必须在 DevEco Studio 里跑，Node CI 覆盖不到。
>
> 🚫 **小游戏端按需建端，不是标准端**。小游戏（Canvas/WebGL 游戏产品线）和小程序（`apps/weapp/`，Taro）是两条完全不同的产品线 —— **Taro 不能编译小游戏**，真要做游戏内容才跑 `pnpm setup:minigame` 建 `apps/minigame/`（Cocos Creator 4.x）。规划见 `~/.hermes/profiles/vibe/skills/custom/strict-project-scaffold/references/minigame-planning.md`（该文档已写明 aaigc 不在小游戏范围）。此前误建的小游戏端已移除，Check 11 对该端是「按需存在」语义。

## Project Structure

```
aaigc/
├── shared/                   # Cross-platform code
│   ├── types/                # Product, Tool, ToolCategory, Locale, Platform
│   ├── constants/            # locales, WORKER_URL, error-codes, endpoints, products
│   ├── messages/             # en.json, zh-CN.json, zh-TW.json, ja.json
│   ├── i18n/README.md        # 已删除两语 helper；跨端文案一律走 messages/
│   ├── utils/                # Pure utility functions (cross-platform only)
│   ├── api/                  # createApiClient / http-client / favorites / track / ranking
│   ├── validators/           # Zod schemas
│   ├── data/                 # Static tools/products/family data
│   ├── tools/                # 38 个工具的纯逻辑实现（5 端共享，受 J-8: 0 第三方依赖）
│   └── js/messages/          # 切片产物（scripts/build-shared-messages.mjs 生成）
├── apps/
│   ├── web/                  # Next.js — UI rendering only
│   ├── weapp/                # 小程序（Taro v4 + React）
│   ├── app/                  # React Native Expo
│   ├── desktop/              # Tauri
│   └── cli/                  # CLI
├── data/                     # 静态数据：tools.ts, products.ts
├── tests/                    # Unit + E2E tests
├── scripts/                  # check.sh, translate.mjs 等
└── docs/                     # project-plan.md, architecture.md, decisions.md
```

## Code Organization Rules

### shared/ —— 跨平台非 UI 代码

- `types/` — 类型定义
- `constants/` — 常量
- `messages/` — 翻译文件（4 语言，唯一真源）
- `i18n/` — 仅保留说明文件（t() helper 已删除，理由见该 README）
- `utils/` — 纯函数（**只放跨端复用**；端内私有放 apps/<端>/src/ 下）
- `api/` — createApiClient / http-client / favorites / track / ranking
- `validators/` — Zod schema
- `data/` — 静态数据
- `tools/` — 38 个工具的纯逻辑实现（**所有端共享**）
- `js/messages/` — 切片产物

### apps/<端>/ —— 仅 UI 渲染代码

- `app/[locale]/` 或 `pages/` — 页面路由
- `components/` — UI 组件
- `src/hooks/` — **端专用** React hook（仅本端用，**不进 shared/hooks/**）
- **❌** `constants/utils/validators/messages/lib/` — 这些目录**禁止**出现在 apps/ 下

## Hard Rules（项目级铁律）

- **1.3** `.gitignore` 必含 `test-pages/`；临时测试页只能放 `test-pages/`，不进 git
- **1.4** `apps/web/src/components/BrowserCompatGate.tsx` 必装；该组件**零 Tailwind 类名**；用 SSR 注入 `<script>`；特性检测不达标才显示遮罩
- **SK-8** 代码内禁止非空 fallback（`process.env.X || 'xxx'`）；"没配" = "明确失败"
- **J-8** `shared/tools/` 保持 0 第三方依赖（5 端共享，第三方依赖的代价由所有端承担）
- **G-2** 端专用 hook 放 `apps/<端>/src/hooks/`，不进 `shared/hooks/`；只有跨端复用才进 shared/hooks/

## i18n Rules

- 所有用户可见字符串必须放在 `shared/messages/` 翻译文件
- 代码中禁止 `locale === 'en' ? 'xxx' : 'yyy'` 硬编码显示文本
- 默认 locale: `en`（English）
- 4 语言：en, zh-CN, zh-TW, ja
- 源语言：`en.json` 和 `zh-CN.json` 手写并行
- 其他语言：经 `node scripts/translate.mjs` 从 en 生成（需 `AI_API_KEY`）
- 服务端：`getTranslations({ locale, namespace })` from `next-intl/server`
- 客户端：`useTranslations('namespace')` from `next-intl`
- 非 React 端：按 locale 直接读 `shared/messages/<locale>.json` 或 `shared/js/messages/<locale>/<ns>.json`

## Git Rules

- 所有开发在 `preview` 分支
- `main` 分支只通过 PR 合并接收代码
- 不直接提交 main
- 不手动 `vercel --prod`
- 推 preview → Vercel Preview 环境
- PR 合入 main → Vercel Production 环境

## Design System

Mistral warm color palette:
- `--color-bg`: #fffaeb (warm ivory)
- `--color-surface`: #fff0c2 (cream)
- `--color-accent`: #fa520f (amber orange)
- `--color-accent-light`: #ffa110 (warm amber)
- `--color-text`: #1f1f1f (warm black)
- `--color-text-secondary`: #767d88 (muted gray)

## Quality Gate

- Pre-commit（`.husky/pre-commit`）：结构检查 + TypeScript + Lint + 单元测试 + i18n 硬编码 + 桌面端语言同步 + J-8 0 三方依赖 + 迁移安全
- `scripts/check.sh`：结构 + 迁移安全 + i18n 硬编码 + 桌面端语言同步 + J-8 + 切片 + 翻译 + Lint + TypeScript + 测试 + 生产构建 + 小程序包体积
- CI（`.github/workflows/ci.yml`）：结构 + 迁移安全 + 翻译 + Lint + TypeScript + 单元测试 + 构建 + E2E

## Deployment

- 1 GitHub 仓库 = 1 Vercel 项目
- preview 分支 → Preview 环境（自动部署）
- main 分支 → Production 环境（通过 PR 合并）
- 回滚：`vercel rollback`（Hobby）或 dashboard（Pro）

## Stats Architecture

Cloudflare Worker（stats gateway）→ Turso（libSQL, counters, rankings, online）
- Worker URL: https://stats.aaigc.workers.dev（已部署）
- 所有项目共享 1 个 Worker + 1 个 Turso DB，key 前缀 `{project}:`
- 统计请求走 Worker，不走 Vercel（节省 function invocations）