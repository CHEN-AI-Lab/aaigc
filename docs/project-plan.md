# AAIGC 门户站 — 项目计划书

> 项目名称：aaigc
> 创建日期：2026-07-17
> 最后更新：2026-08-05
> 状态：Phase 0-5 完成，Phase 6 代码完成，Phase 7-9 待开始

---

## 一、项目概述

### 1.1 项目定位

AAIGC 是一个**产品矩阵门户 + 在线工具箱**。主站 `aaigc.online` 作为所有子域名产品的统一入口，同时提供在线小工具供用户使用。它不是个人作品集，而是**面向公众的产品展示和工具服务平台**。

### 1.2 核心目标

1. **展示产品矩阵** — 让用户一目了然地看到 AAIGC 旗下的所有产品（CookMate、AIHub、Short Drama、Resume Optimizer），点击即可跳转到对应子域名
2. **提供在线工具** — 38 个纯前端小工具，用户可直接在网站上使用，无需登录
3. **多语言支持** — 4 种语言：中文简体、中文繁体、英文、日文，默认英文，根据浏览器语言自动适配
4. **品牌塑造** — 通过 Mistral 暖色系设计风格，打造 AAIGC 品牌辨识度
5. **访问统计** — 全站工具访问量统计、首页热门工具排行（Cloudflare Worker + Upstash Redis）

### 1.3 非目标（本阶段不做）

- 博客模块
- 用户登录/注册系统（Phase 6 规划）
- 数据库（Neon Postgres 已规划，Phase 6 使用）
- 暗色模式

---

## 二、技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.x |
| 语言 | TypeScript | strict mode |
| 样式 | Tailwind CSS | 4.x |
| 国际化 | next-intl | 4.x |
| 包管理 | pnpm | workspace monorepo |
| 测试 | Vitest + Playwright | 单元测试 + E2E |
| 部署 | Vercel | 独立项目 |
| 统计 | Cloudflare Worker + Upstash Redis | 已部署上线 |

### 2.2 项目结构

```
workspace/aaigc/
├── shared/                       [跨平台共享层]
│   ├── types/index.ts            # Product, Tool, ToolCategory, Locale 等类型
│   ├── constants/
│   │   ├── locales.ts            # locales[], defaultLocale, type Locale
│   │   └── index.ts              # WORKER_URL, 常量 barrel export
│   ├── messages/
│   │   ├── en.json               # 英文原文
│   │   ├── zh-CN.json            # 简体中文
│   │   ├── zh-TW.json            # 繁体中文
│   │   └── ja.json               # 日文
│   ├── i18n/index.ts             # t(locale, path) 通用函数
│   ├── utils/                    # 工具函数
│   └── hooks/
│       └── useVisitTracking.ts   # 统计埋点 + 数据获取 hook
├── apps/web/                     [Next.js 应用 — 仅 UI 渲染]
│   ├── src/
│   │   ├── i18n/
│   │   │   ├── routing.ts        # defineRouting — 从 shared 导入 locales
│   │   │   ├── navigation.ts     # createNavigation — 语言感知的 Link/Router
│   │   │   └── request.ts        # getRequestConfig — 静态 import 翻译
│   │   ├── proxy.ts              # createMiddleware — locale 检测 + 重定向
│   │   ├── globals.css           # Mistral 设计系统 CSS 变量
│   │   ├── app/
│   │   │   ├── layout.tsx        # 根 layout（html, body, 字体）
│   │   │   ├── not-found.tsx     # 404 页面
│   │   │   └── [locale]/
│   │   │       ├── layout.tsx    # 语言布局（Header + Footer + Provider）
│   │   │       ├── page.tsx      # 首页（Hero + 产品 + 新工具 + 热门工具）
│   │   │       ├── products/
│   │   │       │   ├── page.tsx           # 产品列表
│   │   │       │   └── [slug]/page.tsx    # 产品详情
│   │   │       ├── tools/
│   │   │       │   ├── page.tsx           # 工具列表（按分类分组）
│   │   │       │   └── [slug]/page.tsx    # 工具页面（通用渲染器）
│   │   │       ├── about/page.tsx         # 关于页
│   │   │       ├── stats/page.tsx         # 统计后台（管理员，无鉴权）
│   │   │       ├── privacy/page.tsx       # 隐私政策
│   │   │       └── updates/page.tsx       # 更新日志
│   │   └── components/
│   │       ├── Header.tsx              # 导航栏
│   │       ├── Footer.tsx              # 底部
│   │       ├── LanguageSwitcher.tsx    # 语言切换
│   │       ├── ThemeSwitcher.tsx       # 主题切换（placeholder）
│   │       ├── ToolShell.tsx           # 工具页面外壳
│   │       ├── ToolsClient.tsx         # 工具列表客户端
│   │       ├── ToolPageClient.tsx      # 工具详情页客户端
│   │       ├── VisitTracker.tsx        # 统计埋点组件
│   │       ├── HomeToolRanking.tsx     # 首页工具排行
│   │       ├── StatsChart.tsx          # 统计图表
│   │       ├── StatsBreakdown.tsx      # 统计细分面板
│   │       ├── DateRangePicker.tsx     # 日期范围选择器
│   │       └── tools/                  # 38 个工具组件
│   ├── next.config.ts           # withNextIntlPlugin
│   └── package.json
├── data/                         [静态数据]
│   ├── products.ts               # 4 个产品的完整数据
│   └── tools.ts                  # 38 个工具的元数据
├── docs/                         [文档]
│   ├── project-plan.md           # 项目计划（本文档）
│   ├── architecture.md           # 统计架构设计
│   └── worker-code.md            # Cloudflare Worker 完整代码
├── scripts/                      [自动化脚本]
│   ├── translate.mjs             # AI 翻译脚本
│   ├── check.sh                  # 全量质量门禁
│   ├── check-light.sh            # 轻量质量门禁
│   ├── check-structure.sh        # 结构合规检查
│   ├── check-translations.py     # 翻译 key 一致性检查
│   ├── check-json.py             # JSON 格式检查
│   └── find-dev-server.sh        # 查找开发服务器端口
├── tests/                        [测试]
│   ├── setup.ts                  # 测试配置
│   ├── unit/
│   │   ├── shared.test.ts        # shared 层测试
│   │   ├── data.test.ts          # 工具数据测试
│   │   ├── calculator.test.ts    # 计算器测试
│   │   └── fileRename.test.ts    # 文件重命名测试
│   └── e2e/
│       ├── home.spec.ts          # 首页 E2E
│       ├── tools.spec.ts         # 工具 E2E
│       ├── tools-more.spec.ts    # 更多工具 E2E
│       ├── tools-edge-cases.spec.ts  # 边界情况 E2E
│       ├── performance.spec.ts   # 性能测试
│       └── a11y.spec.ts          # 无障碍测试
├── .husky/
│   └── pre-commit                # 翻译记忆 + 自动翻译提示
├── .github/workflows/
│   └── ci.yml                    # 结构检查 + Lint + Test + Build
├── .env.example                  # 环境变量说明
├── CLAUDE.md                     # 项目规则文件
├── vercel.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

### 2.3 i18n 规则

| 规则 | 说明 |
|------|------|
| 默认语言 | `en`（英文） |
| 支持语言 | `en`, `zh-CN`, `zh-TW`, `ja` |
| 翻译方式 | en.json 和 zh-CN.json 同时手写，互不翻译 |
| 其他语言 | 从英文用 AI 翻译脚本生成 |
| 代码规范 | 不硬编码文字，全部用 `t("key")` 或 `useTranslations('ns')` |
| Provider | `NextIntlClientProvider` 必须 `key={locale}` |
| 语言切换 | `router.push(pathname, {locale})`，禁止 `window.location.href` |

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
| `--color-dark-bg` | `#1f1f1f` | 深色按钮背景 |

### 3.2 排版规则

| 层级 | 字号 | 行高 | 字距 | 字重 |
|------|------|------|------|------|
| Display/Hero | 56px | 1.0 | -1.4px | 400 |
| Section 标题 | 36px | 1.1 | -0.9px | 400 |
| 产品/工具标题 | 24px | 1.3 | 0 | 500 |
| 正文 | 16px | 1.5 | 0 | 400 |
| 标签/说明 | 14px | 1.4 | +0.35px | 500 |

---

## 四、产品数据

| 产品 | slug | 子域名 | 状态 | 图标 |
|------|------|--------|------|------|
| CookMate | cookmate | cookmate.aaigc.online | `live` | 🍳 |
| AIHub | aihub | aihub.aaigc.online | `live` | 🤖 |
| Short Drama | short-drama | short-drama.aaigc.online | `wip` | 🎬 |
| Resume Optimizer | resume-optimizer | resume-optimizer.aaigc.online | `wip` | 📝 |

---

## 五、工具数据（38 个工具）

### 开发工具（12 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| json-formatter | JSON 格式化/校验 | JsonFormatter | 无 |
| regex-tester | 正则测试器 | RegexTester | 无 |
| base64 | Base64 编解码 | Base64Codec | 无 |
| url-encode | URL 编解码 | UrlEncoder | 无 |
| jwt-decoder | JWT 解码器 | JwtDecoder | 无 |
| uuid-generator | UUID 生成器 | UuidGenerator | 无 |
| html-preview | HTML 实时预览 | HtmlPreview | 无 |
| html-entities | HTML 实体编码 | HtmlEntities | 无 |
| css-minifier | CSS 压缩 | CssMinifier | 无 |
| number-base | 进制转换 | NumberBaseConverter | 无 |
| yaml-json | YAML ↔ JSON | YamlJsonConverter | js-yaml |
| json-to-csv | JSON → CSV | JsonToCsv | 无 |

### 文本工具（7 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| word-counter | 字数统计 | WordCounter | 无 |
| markdown-preview | Markdown 预览 | MarkdownPreview | react-markdown |
| case-converter | 大小写转换 | CaseConverter | 无 |
| text-diff | 文本对比 | TextDiff | diff |
| lorem-ipsum | Lorem Ipsum 生成 | LoremIpsum | 无 |
| text-to-slug | 文本转 Slug | TextToSlug | 无 |
| list-sorter | 列表排序 | ListSorter | 无 |

### 安全工具（1 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| password-generator | 密码生成器 | PasswordGenerator | 无 |

### 图像工具（5 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| qrcode | 二维码生成器 | QrCodeGenerator | qrcode |
| color-picker | 颜色选择器 | ColorPicker | 无 |
| image-to-base64 | 图片转 Base64 | ImageToBase64 | 无 |
| image-converter | 图片格式转换 | ImageConverter | 无 |
| image-editor | 图片编辑器 | ImageEditor | 无 |

### 数学工具（1 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| calculator | 计算器 | Calculator | 无 |

### 网络工具（4 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| ip-lookup | IP 查询 | IpLookup | 无 |
| dns-lookup | DNS 查询 | DnsLookup | 无 |
| http-status-codes | HTTP 状态码查询 | HttpStatusCodes | 无 |
| user-agent-parser | User-Agent 解析 | UserAgentParser | 无 |

### 时间工具（3 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| timestamp | 时间戳转换 | TimestampConverter | 无 |
| date-calculator | 日期计算器 | DateCalculator | 无 |
| timer | 计时器 | Timer | 无 |

### 其他工具（5 个）
| slug | 名称 | 组件 | 依赖 |
|------|------|------|------|
| emoji-picker | Emoji 选择器 | EmojiPicker | 无 |
| random-generator | 随机生成器 | RandomGenerator | 无 |
| cron-builder | Cron 表达式构建 | CronBuilder | 无 |
| pdf-tool | PDF 合并/拆分 | PdfTool | pdf-lib, jszip |
| file-renamer | 文件批量重命名 | FileRenamer | 无 |

---

## 六、开发阶段

### 总览

```
Phase 0: 项目骨架搭建          ✅ 已完成
Phase 1: 设计系统 + 国际化     ✅ 已完成
Phase 2: 核心页面开发          ✅ 已完成
Phase 3: 在线工具实现          ✅ 已完成（38 个工具）
Phase 4: 质量保障 + 部署       ✅ 已完成
Phase 5: 访问统计 + 排行榜     ✅ 已完成
Phase 6: 用户系统              ✅ 已完成（已上线）
Phase 7: 收藏 + 点赞           ✅ 已完成
Phase 8: 评论系统              📅 待开始
Phase 9: 个性化推荐            📅 待开始
```

### Phase 0-4 已完成

详见下方各阶段任务清单（已全部完成，从略）。

### Phase 5：访问统计 + 首页排行榜（✅ 已完成）

**架构：** Cloudflare Worker（统计网关）+ Upstash Redis（计数）

**已完成：**
| # | 任务 | 说明 |
|---|------|------|
| 5.1 | 统计埋点组件 | VisitTracker.tsx 嵌入首页和工具详情页 |
| 5.2 | 统计 Hook | useVisitTracking.ts，含 fetchStats/fetchDaily/fetchRanking/fetchOnline/fetchPages/fetchCountries/fetchReferrer |
| 5.3 | 统计页面 | /stats 页面，含 4 指标卡片、折线图、页面/国家/来源排行、工具热门排行 |
| 5.4 | 日期范围选择器 | DateRangePicker 组件，today/7d/30d/all/custom 模式 |
| 5.5 | 首页排行榜 | HomeToolRanking 组件，热门工具展示 |
| 5.6 | Worker 代码 | 完整 Cloudflare Worker 代码（docs/worker-code.md） |
| 5.7 | 架构文档 | docs/architecture.md 和 docs/worker-code.md |
| 5.8 | 工具 createdAt | 所有 38 个工具标注了创建时间 |
| 5.9 | 新工具区 | 首页展示最新 4 个工具 |
| 5.10 | 热门工具区 | 首页展示按访问量排序的工具排行 |

**已完成：**
| 5.11 | 部署 Cloudflare Worker | 已部署至 stats.aaigc.workers.dev（已验证在线） |
| 5.12 | 配置 Upstash Redis | 已配置 Worker 环境变量 |
| 5.13 | 管理员鉴权 | 与 Phase 6 用户系统一起做，或加临时密码锁 |

### Phase 6：用户系统（✅ 代码完成）

**目标：** 注册、登录、OAuth 认证（Google/GitHub）、邮箱验证码

**架构：** Neon Postgres + Prisma + NextAuth.js v5

**已完成：**
| # | 任务 | 说明 |
|---|------|------|
| 6.1 | 注册 Neon 账号 | 已创建数据库（新加坡，PG18） |
| 6.2 | 安装依赖 | Prisma, NextAuth, bcryptjs, @auth/prisma-adapter 等已安装 |
| 6.3 | 建表 User/Account/Session/VerificationCode | Prisma schema 完整（5 个模型） |
| 6.4 | 注册 API | POST /api/auth/register（密码注册） |
| 6.5 | 登录 API | NextAuth Credentials 密码登录 + OAuth |
| 6.6 | 用户信息 API | GET /api/user/profile |
| 6.7 | 前端登录/注册/账号页面 | 表单 + 校验 + 邮箱验证码 + OAuth 按钮 |
| 6.8 | 前端用户状态管理 | NextAuth SessionProvider + useSession |

**待完成：**
| # | 任务 | 说明 |
|---|------|------|
| 6.9 | 统计页面鉴权 | 管理员角色访问 /stats |

**已完成追加：**
| 6.10 | prisma migrate | 数据库表已建（3 个迁移已应用） |
| 6.11 | 配置 AUTH_SECRET | 你已配到 Vercel 环境变量 |

### Phase 7：收藏 + 点赞（✅ 已完成）

| # | 任务 | 说明 |
|---|------|------|
| 7.1 | 建表 favorites | Prisma schema 已建，已 migrate | ✅ |
| 7.2 | API 路由 | POST+GET /api/favorites（支持 type） | ✅ |
| 7.3 | 收藏按钮 | 工具 + 产品详情页 ☆ SVG 按钮 | ✅ |
| 7.4 | 收藏列表 | 账号页显示已收藏的工具/产品列表 | ✅ |
| 7.5 | 点赞功能 | 调研确认工具站不需要，已移除 | ✅ |

### Phase 8：评论系统（📅 待开始）
### Phase 9：个性化推荐（📅 待开始）

---

## 七、质量门禁标准

### 每次提交前检查（pre-commit）
```
□ 翻译记忆自动学习（修改非源语言文件时）
□ 翻译 key 自动同步（修改源语言文件时）
□ 手动确认是否自动翻译其他语言
```

### 每次部署前检查（check.sh）
```
□ tsc --noEmit                 # TypeScript 编译
□ pnpm test                    # 测试
□ pnpm build                   # 构建
□ bash scripts/check-structure.sh  # 结构合规
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

## 八、验证清单

### 构建验证
```
□ pnpm build 通过（无 TypeScript/Lint 错误）
□ pnpm dev 启动无报错
□ /en 返回 200
□ /zh-CN 返回 200
□ /zh-TW 返回 200
□ /ja 返回 200
□ 语言切换正常（4 种语言）
□ 所有内部链接保持语言前缀
□ 所有 38 个工具页面加载正常
□ 统计页面 /stats 可访问
```

### 部署验证
```
□ aaigc.online 可访问
□ 自动重定向（按浏览器语言）
□ 所有产品链接跳转到正确子域名
□ 移动端适配（响应式）
□ CDN 缓存正常
```

---

## 九、后续规划维护规则

### 规则 1：新功能必须先写进规划

所有新增功能，在开始编码前必须先完成：
1. 更新 `docs/architecture.md` → 数据模型 + API 设计
2. 更新 `docs/project-plan.md` → 加入实现阶段 + 任务清单
3. 评审确认
4. 开始编码

### 规则 2：规划文件是唯一真理
- `docs/architecture.md` 是技术架构的权威来源
- `docs/project-plan.md` 是功能规划和进度的权威来源
- 代码实现必须与这两个文件一致

### 规则 3：规划文件更新时机
| 时机 | 必须更新 |
|------|---------|
| 新增功能 | `architecture.md` + `project-plan.md` |
| 修改架构 | `architecture.md` |
| 完成阶段 | `project-plan.md` 状态标记 |