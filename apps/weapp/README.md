# apps/weapp — 微信小程序端（Taro v4 + React）

## 构建

```bash
# 开发（watch）
pnpm --filter weapp run dev:weapp

# 生产构建（产物在 apps/weapp/dist）
pnpm --filter weapp run build:weapp

# 类型检查
pnpm --filter weapp run typecheck
```

`build:weapp` / `dev:weapp` 会先跑 `scripts/gen-theme.mjs` 生成 `src/theme.generated.css`
（主题色板来自 `shared/constants/theme.ts`），再执行 `taro build`。**不要跳过 gen-theme**，
否则主题变量缺失。

## 构建期环境变量

小程序没有 `process` 对象，env 必须在构建期替换成字面量。
通过 `config/index.ts` 的 `defineConstants.__AAIGC_WEAPP_ENV__` 注入，
由 `src/runtime/env.ts` 作为**唯一出口**消费。

| 变量 | 用途 | 未配置时 |
|---|---|---|
| `WEAPP_API_BASE_URL` | API 基址（末尾斜杠会被去掉） | `apiBaseUrl` 为空串 → 登录/收藏明确报「未配置」，**不做非空 fallback**（SK-8） |
| `WEAPP_CLIENT_ID` | Bearer 通道 clientId | 同上 |
| `NODE_ENV` | 埋点环境标识 | `production` |

示例：

```bash
WEAPP_API_BASE_URL=https://your-domain WEAPP_CLIENT_ID=weapp \
  pnpm --filter weapp run build:weapp
```

> ⚠️ 小程序产物是公开的，**不要注入任何密钥**。

## 已验证的关键结论

- **Taro 能编译 pnpm workspace 里 `shared/` 的 TS 源码**，无需 `node-linker=hoisted`。
  生效配置是 `mini.compile.include` 与 `h5.compile.include`（**两处都要写**）
  + `compiler.prebundle.enable = false`。
- **`import()` 在小程序侧不会生成异步 chunk**（实测 `installedChunks` 计数为 0，
  JSON 被内联进页面 chunk）→ 文案用**静态导入切片**，静态导入体积口径清晰、无运行期竞态。
- **`defineConstants` 是字面量文本替换**：静态标识符（如 `__AAIGC_WEAPP_ENV__`）可替换；
  `process.env[name]` 动态下标不可。两者不矛盾。
- **主包实测 687.5 KB（占 2MB 的 33.6%）**。体积大头是 messages 切片（约 351 KB），
  不是工具代码（四个页面合计约 10 KB）。

## 当前能力与限制

- 可用工具 **30 / 38**。小程序具备 `network` / `clipboard` / `timer`，
  不具备 `dom` / `canvas` / `file` —— 因此图片类 4 个 + PDF 不开；
  `ip-lookup` / `dns-lookup` 是 T3（依赖服务端网络），也不在原生列表内。
- **三个工具是降级实现**，UI 上标了 badge，避免用户遇到能力差异却不知原因：
  - `markdown-preview`：shared 是正则版，弱于 Web 的 unified（GFM 表格/删除线/脚注）
  - `yaml-json`：shared 是受限子集（不支持 flow style / 锚点别名 / 多行块）
  - `html-entities`：shared 约 40 条命名实体表，弱于浏览器 DOMParser 完整表
- tabBar 文案在 `app.config.ts` 是**构建期默认值**，运行期由 `app.tsx`
  用 `Taro.setTabBarItem` 按当前语言覆写。

## 尚未实现

- **分包（subpackages）**：当前未配置，主包 687 KB 距 2MB 尚有余量。
  一旦接入，主包口径变为「dist 根层级 + pages/」，且 `scripts/check-weapp-bundle-size.py`
  会自动读取 `dist/app.json` 的 `subPackages[].root` 排除子包（无需手改名单）。
- **埋点上报**：`WEAPP_CLIENT_ID` 与 `env` 已就位，上报链路未接。
- 真机/开发者工具验证：本机无微信开发者工具，**所有结论均来自构建产物分析，非真机运行**。

## 目录约定

`apps/*` 下禁止出现 `hooks/` `constants/` `utils/` `validators/` `messages/` `lib/`
这些目录名（由 `scripts/check-structure.sh` 强制）。通用代码一律放 `shared/`，端内只放
页面与 UI。本端的非 UI 通用代码在 `src/runtime/`（i18n / env / api / tool-context / locale）。
