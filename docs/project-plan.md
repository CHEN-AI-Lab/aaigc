# AAIGC 门户站 — 项目计划书

> 项目名称：aaigc
> 创建日期：2026-07-17
> 状态：计划阶段

---

## 一、项目概述

### 1.1 项目定位

AAIGC 是一个**产品矩阵门户 + 在线工具箱**。主站 `aaigc.online` 作为所有子域名产品的统一入口，同时提供一系列在线小工具供用户使用。它不是个人作品集，而是**面向公众的产品展示和工具服务平台**。

### 1.2 核心目标

1. **展示产品矩阵** — 让用户一目了然地看到 AAIGC 旗下的所有产品（CookMate、AIHub、Short Drama、Resume Optimizer），点击即可跳转到对应子域名
2. **提供在线工具** — 14 个纯前端小工具，用户可直接在网站上使用，无需登录
3. **中英双语** — 支持中文和英文，默认英文，根据浏览器语言自动适配
4. **品牌塑造** — 通过 Mistral 暖色系设计风格，打造 AAIGC 品牌辨识度

### 1.3 非目标（本阶段不做）

- 博客模块
- 用户登录/注册系统
- 数据库
- 数据分析/统计
- 暗色模式

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.x |
| 语言 | TypeScript | strict mode |
| 样式 | Tailwind CSS | 4.x |
| 国际化 | next-intl | 4.x |
| 包管理 | pnpm | workspace monorepo |
| 部署 | Vercel | 独立项目 |

### 2.2 项目结构

```
workspace/aaigc/
├── shared/                       [跨平台共享层]
│   ├── types/
│   │   └── index.ts              # Product, Tool, Category 等类型定义
│   ├── constants/
│   │   ├── locales.ts            # locales[], defaultLocale, type Locale
│   │   └── index.ts              # 常量 barrel export
│   ├── messages/
│   │   ├── en.json               # 英文原文（源语言）
│   │   └── zh-CN.json            # 标准中文（源语言，不翻译英文）
│   ├── i18n/
│   │   └── index.ts              # t(locale, path) 通用函数
│   └── utils/
│       └── index.ts              # 工具函数（格式化、验证等）
├── apps/web/                     [Next.js 应用]
│   ├── src/
│   │   ├── i18n/
│   │   │   ├── routing.ts        # defineRouting — 从 shared 导入 locales
│   │   │   ├── navigation.ts     # createNavigation — 语言感知的 Link/Router
│   │   │   └── request.ts        # getRequestConfig — 静态 import 翻译
│   │   ├── proxy.ts              # createMiddleware — locale 检测 + 重定向
│   │   ├── app/
│   │   │   ├── layout.tsx        # 根 layout（html, body, 字体）
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx    # 语言布局（NextIntlClientProvider）
│   │   │   │   ├── page.tsx      # 首页
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx           # 产品列表
│   │   │   │   │   └── [slug]/page.tsx    # 产品详情
│   │   │   │   ├── tools/
│   │   │   │   │   ├── page.tsx           # 工具列表
│   │   │   │   │   └── [slug]/page.tsx    # 工具页面（通用渲染器）
│   │   │   │   └── about/page.tsx         # 关于页
│   │   │   └── not-found.tsx    # 404 页面
│   │   └── components/
│   │       ├── LanguageSwitcher.tsx    # 语言切换（router.push）
│   │       ├── Header.tsx              # 导航栏
│   │       ├── Footer.tsx              # 底部
│   │       ├── ProductCard.tsx         # 产品卡片
│   │       ├── ToolsGrid.tsx           # 工具网格
│   │       └── tools/                  # 各工具组件（14 个）
│   ├── next.config.ts           # withNextIntlPlugin
│   ├── tailwind.config.ts       # Tailwind + Mistral 色板
│   └── package.json
├── data/                         [静态数据]
│   ├── products.ts               # 4 个产品的完整数据
│   └── tools.ts                  # 14 个工具的元数据
├── scripts/                      [自动化脚本]
│   ├── translate.mjs             # AI 翻译脚本（从 .shared/ 复制）
│   ├── check.sh                  # 全量质量门禁
│   ├── check-structure.sh        # 结构合规检查
│   └── check-translations.py     # 翻译 key 一致性检查
├── tests/                        [测试]
│   ├── unit/
│   │   └── shared.test.ts        # shared 层测试
│   └── e2e/
│       └── home.spec.ts          # 首页 E2E 测试
├── .husky/
│   └── pre-commit                # 结构检查 + pnpm test
├── vercel.json                   # 根目录（framework 等）
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

### 2.3 i18n 规则（整合版）

| 规则 | 说明 |
|------|------|
| 默认语言 | `en`（英文） |
| 翻译方式 | en.json 和 zh-CN.json 同时手写，互不翻译 |
| 其他语言 | 从英文用 AI 翻译脚本生成 |
| 代码规范 | 不硬编码文字，全部用 `t("key")` |
| 链接规范 | 用 `@/i18n/navigation` 的 Link，自动加语言前缀 |
| Provider | `NextIntlClientProvider` 必须 `key={locale}` |
| 消息加载 | `getMessages({ locale })` 显式传参 |
| 语言切换 | `router.push(pathname, {locale})`，禁止 `window.location.href` |
| 页面规范 | 每个页面加 `setRequestLocale(locale)` + `generateStaticParams()` |

---

## 三、设计系统

### 3.1 Mistral 暖色系色板

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-bg` | `#fffaeb` | 页面背景（暖象牙白） |
| `--color-surface` | `#fff0c2` | 卡片背景（奶油色） |
| `--color-accent` | `#fa520f` | 主强调色（琥珀橙） |
| `--color-accent-light` | `#ffa110` | 次强调色（暖琥珀） |
| `--color-gradient` | `linear-gradient(180deg, #ffd900, #ffe295, #ffa110, #ff8105, #fb6424, #fa520f)` | 渐变条 |
| `--color-text` | `#1f1f1f` | 正文（暖黑） |
| `--color-text-secondary` | `#767d88` | 次要文字 |
| `--color-dark` | `#1f1f1f` | 深色按钮背景 |
| `--font-primary` | `'Inter', system-ui, sans-serif` | 正文字体 |

### 3.2 排版规则

| 层级 | 字号 | 行高 | 字距 | 字重 |
|------|------|------|------|------|
| Display/Hero | 56px | 1.0 | -1.4px | 400 |
| Section 标题 | 36px | 1.1 | -0.9px | 400 |
| 产品/工具标题 | 24px | 1.3 | 0 | 500 |
| 正文 | 16px | 1.5 | 0 | 400 |
| 标签/说明 | 14px | 1.4 | +0.35px | 500 |

### 3.3 组件样式

| 组件 | 样式 |
|------|------|
| 按钮（主） | 暖黑 #1f1f1f 背景，白色文字，无圆角 |
| 按钮（次） | 奶油色 #fff0c2 背景，暖黑文字，无圆角 |
| 卡片 | 奶油色或暖白背景，暖金色多层阴影 |
| 导航 | 暖象牙白背景，暖黑文字，琥珀橙强调 |
| 标签/徽章 | 琥珀橙背景，白色文字 |

---

## 四、产品数据

| 产品 | slug | 子域名 | 状态 | 图标 |
|------|------|--------|------|------|
| CookMate | cookmate | cookmate.aaigc.online | `live` | 🍳 |
| AIHub | aihub | aihub.aaigc.online | `live` | 🤖 |
| Short Drama | short-drama | short-drama.aaigc.online | `wip` | 🎬 |
| Resume Optimizer | resume-optimizer | resume-optimizer.aaigc.online | `wip` | 📝 |

每个产品包含：名称、slug、描述中英文、图标、截图路径、技术栈标签、状态、子域名链接、功能亮点列表（3-5 条）。

---

## 五、工具数据

| 分类 | slug | 工具名称 | 组件名 | npm 依赖 |
|------|------|---------|--------|----------|
| dev | json-formatter | JSON 格式化/校验 | `JsonFormatter` | 无 |
| dev | regex-tester | 正则测试器 | `RegexTester` | 无 |
| dev | base64 | Base64 编解码 | `Base64Codec` | 无 |
| dev | url-encode | URL 编解码 | `UrlEncoder` | 无 |
| dev | jwt-decoder | JWT 解码器 | `JwtDecoder` | 无 |
| text | markdown-preview | Markdown 预览 | `MarkdownPreview` | react-markdown |
| text | word-counter | 字数统计 | `WordCounter` | 无 |
| text | text-diff | 文本对比 | `TextDiff` | diff |
| time | timestamp | 时间戳转换 | `TimestampConverter` | 无 |
| time | date-calculator | 日期计算器 | `DateCalculator` | 无 |
| image | qrcode | 二维码生成器 | `QrCodeGenerator` | qrcode |
| image | color-picker | 颜色选择器 | `ColorPicker` | 无 |
| convert | yaml-json | YAML ↔ JSON | `YamlJsonConverter` | js-yaml |
| convert | html-entities | HTML 实体编码 | `HtmlEntities` | 无 |

每个工具均为**纯前端实现**，无需后端 API。

---

## 六、开发阶段

### 阶段划分总览

```
Phase 0: 项目骨架搭建          → 基础设施就绪
Phase 1: 设计系统 + 国际化     → 视觉和语言就绪
Phase 2: 核心页面开发          → 所有页面可访问
Phase 3: 在线工具实现          → 14 个工具可用
Phase 4: 质量保障 + 部署       → 上线可用
```

---

### Phase 0：项目骨架搭建（预计 1 天）

**目标**：完整 monorepo 结构、构建工具链、共享层类型定义、Git 仓库初始化。

**任务清单**：

| # | 任务 | 涉及文件 | 说明 |
|---|------|---------|------|
| 0.1 | 初始化 pnpm monorepo | `package.json`, `pnpm-workspace.yaml`, `tsconfig.json` | 配置 workspace 和 TypeScript strict |
| 0.2 | 创建 shared 包 | `shared/package.json`, `shared/tsconfig.json` | 跨平台共享层基础结构 |
| 0.3 | 创建 apps/web 包 | `apps/web/package.json`, `apps/web/tsconfig.json` | Next.js 应用基础 |
| 0.4 | 安装核心依赖 | — | next, react, tailwindcss, next-intl, typescript |
| 0.5 | 创建 shared/types | `shared/types/index.ts` | Product, Tool, ToolCategory, Locale 等类型 |
| 0.6 | 创建 shared/constants | `shared/constants/locales.ts`, `shared/constants/index.ts` | locales 配置，其他常量 |
| 0.7 | 配置 Tailwind CSS | `apps/web/tailwind.config.ts`, `apps/web/src/globals.css` | 基础 Tailwind 配置 |
| 0.8 | 配置 next.config.ts | `apps/web/next.config.ts` | withNextIntlPlugin |
| 0.9 | 初始化 Git 仓库 | `.gitignore` | 创建 aaigc 仓库 |
| 0.10 | 创建 scripts/ 目录 | `scripts/check.sh`, `scripts/check-structure.sh` | 初始版本（Phase 4 完善） |

**交付物**：`pnpm build` 通过，TypeScript 无报错。

---

### Phase 1：设计系统 + 国际化（预计 1 天）

**目标**：Mistral 暖色系设计就绪、next-intl 全套配置就绪、翻译文件就绪。

**任务清单**：

| # | 任务 | 涉及文件 | 说明 |
|---|------|---------|------|
| 1.1 | 配置 proxy.ts | `apps/web/src/proxy.ts` | createMiddleware(routing)，locale 检测 + 重定向 |
| 1.2 | 配置 i18n/routing.ts | `apps/web/src/i18n/routing.ts` | defineRouting，从 shared/locales.ts 导入 |
| 1.3 | 配置 i18n/navigation.ts | `apps/web/src/i18n/navigation.ts` | createNavigation，导出 Link/redirect/useRouter |
| 1.4 | 配置 i18n/request.ts | `apps/web/src/i18n/request.ts` | getRequestConfig，静态 import 翻译 |
| 1.5 | 配置 shared/i18n | `shared/i18n/index.ts` | t(locale, path) 通用函数 |
| 1.6 | 安装字体 | — | 配置 Inter 字体（Google Fonts） |
| 1.7 | 编写 Mistral 设计系统 | `apps/web/tailwind.config.ts`, `apps/web/src/globals.css` | CSS 变量、排版系统、组件样式 |
| 1.8 | 编写 en.json | `shared/messages/en.json` | 英文原文翻译（首页、产品、工具、关于） |
| 1.9 | 编写 zh-CN.json | `shared/messages/zh-CN.json` | 标准中文翻译（同时手写，不翻译英文） |
| 1.10 | 创建根 layout | `apps/web/src/app/layout.tsx` | html, body, 字体，不包含 Provider |
| 1.11 | 创建 [locale]/layout.tsx | `apps/web/src/app/[locale]/layout.tsx` | NextIntlClientProvider key={locale}，generateStaticParams, setRequestLocale |
| 1.12 | 创建 not-found.tsx | `apps/web/src/app/not-found.tsx` | 404 页面（中英双语） |
| 1.13 | 配置 vercel.json | `vercel.json` | 根目录，framework/outputDirectory/installCommand/buildCommand |

**交付物**：`pnpm dev` 启动，浏览器访问 `/en` 和 `/zh-CN` 均正常显示。

---

### Phase 2：核心页面开发（预计 2 天）

**目标**：所有页面骨架可访问，首页展示产品矩阵和工具入口。

**任务清单**：

| # | 任务 | 涉及文件 | 说明 |
|---|------|---------|------|
| 2.1 | 创建 Header 组件 | `apps/web/src/components/Header.tsx` | 导航栏：Logo + 产品/Tools/About 链接 + LanguageSwitcher |
| 2.2 | 创建 Footer 组件 | `apps/web/src/components/Footer.tsx` | 品牌链接 + 版权 + 社交链接 |
| 2.3 | 创建 LanguageSwitcher | `apps/web/src/components/LanguageSwitcher.tsx` | router.push(pathname, {locale}) |
| 2.4 | 编写数据文件 products.ts | `data/products.ts` | 4 个产品的完整数据（名称、描述、截图、技术栈、状态、链接） |
| 2.5 | 编写数据文件 tools.ts | `data/tools.ts` | 14 个工具的元数据（名称、分类、图标、描述） |
| 2.6 | 创建 ProductCard 组件 | `apps/web/src/components/ProductCard.tsx` | 产品卡片：图标 + 名称 + 描述 + 状态标签 + 跳转按钮 |
| 2.7 | 创建 HomePage | `apps/web/src/app/[locale]/page.tsx` | Hero + 产品矩阵（4 卡片网格） + 工具分类快速入口 |
| 2.8 | 创建 ProductsPage | `apps/web/src/app/[locale]/products/page.tsx` | 产品列表，可筛选（按状态/按技术栈） |
| 2.9 | 创建 ProductDetailPage | `apps/web/src/app/[locale]/products/[slug]/page.tsx` | 产品详情：截图 + 描述 + 技术栈 + 功能列表 + 跳转按钮 |
| 2.10 | 创建 ToolsPage | `apps/web/src/app/[locale]/tools/page.tsx` | 工具列表，按分类分组展示，可搜索 |
| 2.11 | 创建 AboutPage | `apps/web/src/app/[locale]/about/page.tsx` | AAIGC 品牌介绍 + 联系方式 + GitHub 链接 |
| 2.12 | 集成 Header/Footer 到 layout | `apps/web/src/app/[locale]/layout.tsx` | 所有页面共享导航和底部 |

**交付物**：所有页面路由可访问，中英双语显示正常。

---

### Phase 3：在线工具实现（预计 3-4 天）

**目标**：14 个纯前端工具全部可用，用户可直接在网站上使用。

**分类和顺序**（从易到难实现）：

#### 第一批：非常简单（无依赖，纯逻辑）

| # | 任务 | 组件 | 难度 |
|---|------|------|------|
| 3.1 | URL 编解码 | `UrlEncoder` | ⭐ 极简单 |
| 3.2 | Base64 编解码 | `Base64Codec` | ⭐ 极简单 |
| 3.3 | 字数统计 | `WordCounter` | ⭐ 极简单 |
| 3.4 | HTML 实体编码 | `HtmlEntities` | ⭐ 极简单 |
| 3.5 | 时间戳转换 | `TimestampConverter` | ⭐ 极简单 |

#### 第二批：简单（少量逻辑）

| # | 任务 | 组件 | 难度 |
|---|------|------|------|
| 3.6 | 颜色选择器 | `ColorPicker` | ⭐⭐ 简单 |
| 3.7 | JSON 格式化/校验 | `JsonFormatter` | ⭐⭐ 简单 |
| 3.8 | 正则测试器 | `RegexTester` | ⭐⭐ 简单 |
| 3.9 | JWT 解码器 | `JwtDecoder` | ⭐⭐ 简单 |
| 3.10 | 日期计算器 | `DateCalculator` | ⭐⭐ 简单 |

#### 第三批：中等（有第三方依赖）

| # | 任务 | 组件 | 依赖 |
|---|------|------|------|
| 3.11 | 二维码生成器 | `QrCodeGenerator` | `qrcode` npm 包 |
| 3.12 | Markdown 预览 | `MarkdownPreview` | `react-markdown` |
| 3.13 | YAML ↔ JSON | `YamlJsonConverter` | `js-yaml` |
| 3.14 | 文本对比 | `TextDiff` | `diff` npm 包 |

**每个工具的实现标准**：
- 输入框 + 操作按钮 + 输出区域
- 错误处理（输入校验 + 友好错误提示）
- 复制结果按钮
- 中英双语（工具名称、按钮文字、提示信息）
- 响应式（移动端可用）

**交付物**：`/tools/` 下 14 个工具页面全部可用。

---

### Phase 4：质量保障 + 部署（预计 1 天）

**目标**：自动化质量门禁、测试覆盖、部署到 Vercel。

**任务清单**：

| # | 任务 | 说明 |
|---|------|------|
| 4.1 | 完善 check.sh | TypeScript 编译 + Lint + 测试 + 构建 + 结构检查 |
| 4.2 | 完善 check-structure.sh | 检查 shared/ 和 apps/*/ 代码放置合规 |
| 4.3 | 编写 check-translations.py | 验证 en.json 和 zh-CN.json key 一致 |
| 4.4 | 复制 translate.mjs | 从 `/home/ubuntu/workspace/.shared/scripts/translate.mjs` 复制 |
| 4.5 | 配置 .husky/pre-commit | check-structure.sh + pnpm test |
| 4.6 | 配置 GitHub CI | `.github/workflows/ci.yml`：结构检查 + lint + test + build |
| 4.7 | 编写单元测试 | `tests/unit/shared.test.ts`：覆盖 types/constants/utils |
| 4.8 | 编写 E2E 测试 | `tests/e2e/home.spec.ts`：首页加载 + 语言切换 |
| 4.9 | 创建 GitHub 仓库 | 创建 aaigc 仓库，推送代码 |
| 4.10 | 创建 Vercel 项目 | 链接 GitHub，配置 domain + environment |
| 4.11 | 配置 aaigc.online DNS | 腾讯云 DNS 指向 Vercel |
| 4.12 | 部署验证 | curl 验证所有路径 200 |

**交付物**：`aaigc.online` 可访问，所有页面和工具正常。

---

## 七、时间预估

| 阶段 | 工作量 | 说明 |
|------|--------|------|
| Phase 0：骨架搭建 | 1 天 | monorepo、依赖、类型定义 |
| Phase 1：设计 + i18n | 1 天 | 色板、翻译、next-intl 全套 |
| Phase 2：核心页面 | 2 天 | 首页、产品页、工具列表、关于 |
| Phase 3：14 个工具 | 3-4 天 | 从易到难逐个实现 |
| Phase 4：质量 + 部署 | 1 天 | 测试、脚本、CI/CD、上线 |
| **总计** | **8-9 天** | |

---

## 八、首页布局详图

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] AAIGC              Products  Tools  About  [🌐]  │  ← Header
├──────────────────────────────────────────────────────────┤
│                                                           │
│  🚀 AAIGC                                                │  ← Hero
│  让 AI 赋能你的工作与生活                                  │
│  Empowering your work and life with AI                    │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  ← 产品矩阵
│  │ 🍳       │ │ 🤖       │ │ 🎬       │ │ 📝       │    │     4 卡片网格
│  │ CookMate │ │ AIHub    │ │ Short    │ │ Resume   │    │
│  │ AI 食谱   │ │ 工具导航  │ │ Drama    │ │ Opt.     │    │
│  │ 🟢 已上线  │ │ 🟢 已上线 │ │ 🔴 开发中 │ │ 🔴 开发中 │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  ─── 在线工具 ─────────────────────────────               │  ← 工具区域
│                                                           │
│  🔧 开发工具     📝 文本工具     ⏰ 时间工具                │
│  [JSON格式化]    [MD预览]       [时间戳转换]               │
│  [正则测试]      [字数统计]     [日期计算]                 │
│  [Base64]       [文本对比]                                │
│  [URL编解码]                                              │
│  [JWT解码]                                                │
│                                                           │
│  🎨 图像工具     🔄 格式转换                              │
│  [二维码]        [YAML↔JSON]                              │
│  [颜色选择]      [HTML转义]                               │
│                                                           │
│                                       关于 / About →      │
│                                                           │
│  © 2024 AAIGC. All rights reserved.                       │
├──────────────────────────────────────────────────────────┤
│  AAIGC           Products         Tools         About     │  ← Footer
│  品牌介绍        CookMate         JSON        GitHub      │
│  联系方式        AIHub           时间戳       Email       │
│                  Short Drama      二维码                  │
│                  Resume Opt.      更多...                  │
└──────────────────────────────────────────────────────────┘
```

---

## 九、数据模型定义

### Product

```typescript
interface Product {
  id: string                    // slug: cookmate, aihub, short-drama, resume-optimizer
  name: string                  // 中文名
  nameEn: string                // 英文名
  description: string           // 中文描述（1-2 句话）
  descriptionEn: string         // 英文描述
  icon: string                  // emoji 图标
  screenshot?: string           // 截图路径（可选，后续加）
  tags: string[]                // 技术栈标签：['Next.js', 'AI', 'Prisma']
  status: 'live' | 'beta' | 'wip' | 'planned'
  url: string                   // 子域名 URL
  features: string[]            // 功能亮点（中文）
  featuresEn: string[]          // 功能亮点（英文）
}
```

### Tool

```typescript
interface Tool {
  id: string                    // slug: json-formatter, timestamp, qrcode
  name: string                  // 中文名
  nameEn: string                // 英文名
  description: string           // 中文说明
  descriptionEn: string         // 英文说明
  category: ToolCategory        // dev | text | time | image | convert
  icon: string                  // 分类图标
  component: string             // 组件名：JsonFormatter
  isClientOnly: boolean         // 是否纯前端（都是 true）
  npmDeps?: string[]            // npm 依赖（可选）
}
```

### ToolCategory

```typescript
type ToolCategory = 'dev' | 'text' | 'time' | 'image' | 'convert'

interface CategoryInfo {
  id: ToolCategory
  name: string                  // 中文名
  nameEn: string                // 英文名
  icon: string                  // 图标 emoji
  order: number                 // 排序
}
```

---

## 十、质量门禁标准

### 每次提交前检查（pre-commit）

```
□ bash scripts/check-structure.sh    # 结构合规
□ pnpm test                          # 测试通过
```

### 每次部署前检查（check.sh）

```
□ tsc --noEmit                       # TypeScript 编译
□ eslint .                           # Lint
□ pnpm test                          # 测试
□ pnpm build                         # 构建
□ bash scripts/check-structure.sh    # 结构合规
□ python3 scripts/check-translations.py  # 翻译 key 一致
```

### CI 检查（GitHub Actions）

```
□ 结构检查（check-structure.sh）
□ Lint（eslint）
□ 测试（pnpm test）
□ 构建（pnpm build）
```

---

## 十一、验证清单

### 构建验证

```
□ pnpm build 通过（无 TypeScript/Lint 错误）
□ pnpm dev 启动无报错
□ /en 返回 200
□ /zh-CN 返回 200
□ /en/products 返回 200
□ /zh-CN/tools 返回 200
□ 语言切换正常（中→英→中）
□ 所有内部链接保持语言前缀
```

### 部署验证

```
□ aaigc.online 可访问
□ aaigc.online/en 自动重定向（按浏览器语言）
□ aaigc.online/zh-CN 手动指定中文
□ 所有产品链接跳转到正确子域名
□ 所有工具页面加载正常
□ 移动端适配（响应式）
```

---

> 本文档为项目核心计划。每个阶段开始前，将输出更详细的子任务列表。
> 一旦确认，按 Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 顺序执行。