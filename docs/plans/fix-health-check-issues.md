# Fix Plan — 体检发现的 3 类问题

> 背景：pre-delivery health check 发现的问题，用户确认修改。
> 日期：2026-08-19

## 问题清单

### 问题 1: 主题 CSS 变量违规（硬编码颜色，深色模式异常）

**方案**：globals.css 新增 `--color-success` / `--color-info` 语义变量（各主题块各配一色），组件硬编码色改用语义变量。

| 文件 | 位置 | 现状 | 改为 |
|------|------|------|------|
| globals.css | @theme + :root/theme-8/12/11/4/6 | 无 success/info 变量 | 加 `--color-success`、`--color-info` |
| login/LoginClient.tsx | 325-327, 348-349 | bg-red-50/bg-green-50/bg-blue-50 | bg-error/10、bg-success/10、bg-info/10 + border-*/20 + text-* |
| register/RegisterClient.tsx | 188-191, 274, 326-327 | 同上 | 同上 |
| account/AccountClient.tsx | 356 | text-green-500 | text-success |
| ProductCard.tsx | 28 | bg-green-500 text-white | bg-success text-white |
| CopyButton.tsx | 23 | bg-green-500 text-white | bg-success text-white |
| products/[slug]/page.tsx | 47 | bg-green-500 text-white | bg-success text-white |
| updates/page.tsx | 27 | border-[rgba(127,99,21,0.1)] | border-border |
| about/page.tsx | 19 | border-[rgba(127,99,21,0.1)] | border-border |
| LanguageSwitcher.tsx | 50 | border-[rgba(127,99,21,0.15)] | border-border |
| ThemeSwitcher.tsx | 47 | border-[rgba(127,99,21,0.15)] | border-border |
| Footer.tsx | 22, 71 | border-[rgba(127,99,21,0.1)] | border-border |
| ImageEditor.tsx | 197, 209, 244 | border-[rgba(127,99,21,0.1/0.2)] | border-border |
| MarkdownPreview.tsx | 258 | [&_pre]:!border-[rgba(127,99,21,0.12)] | [&_pre]:!border-border |

### 问题 2: updates 页面硬编码 changelog（i18n 违规）

**方案**：数据移入 shared/messages/ 4 语言翻译文件 `updates.items` 数组，页面用 `t.raw('items')` 读取。

| 文件 | 改动 |
|------|------|
| shared/messages/en.json / zh-CN.json / zh-TW.json / ja.json | updates 加 `items: [{date, text}]` （每条 3 项） |
| apps/web/src/app/[locale]/updates/page.tsx | 删除硬编码数组，改用 `t.raw('items')`，删除 dt() 导入 |

### 问题 3: DateCalculator 重复实现 locale 格式化

**方案**：复用 `shared/utils/locale.ts` 的 `dateLocale()`。

| 文件 | 改动 |
|------|------|
| apps/web/src/components/tools/DateCalculator.tsx | 删三目，import { dateLocale } from 'shared/utils/locale' |

## 验证

- [x] `pnpm run typecheck` 通过
- [x] `pnpm run lint` 通过
- [x] `pnpm run test` 通过（197 tests）
- [x] `python3 scripts/check-translations.py`（4 语言 key 一致，1262 keys）
- [x] `pnpm run build` 通过
- [x] 重跑体检 grep：无 border-[rgba(127,99,21,...)] 残留、无 bg-green-500/text-green-500 等 UI 硬编码色（BMI 色阶、密码强度条、Markdown 渲染区等数据可视化色保留）

## 补查发现的额外问题（体检时漏了，修同批处理）

- 工具组件 12 处复制成功按钮 `bg-green-500 text-white scale-105` → `bg-success text-white scale-105`
- 工具组件 20+ 处错误提示 `text-red-500` → `text-error`
- TextDiff/CronBuilder/Calculator 的 diff 高亮色、修复按钮色 等 → 语义变量

## 保留的硬编码色（合理，不用于主题 UI）

- BMI 色阶 `bg-blue-400/bg-green-400/bg-amber-400/bg-red-400`（数据可视化，400 级亮度深色可见）
- 密码强度条 `bg-red-400/bg-amber-400/bg-green-400`（同上）
- HtmlPreview iframe `bg-white`（文档内容，非 UI 色）
- MarkdownPreview 深色编辑区 `bg-[#0d1117]`（工具渲染区，有 isDark 判断）