# apps/app —— AAIGC 移动端（Expo + React Native，iOS / Android）

把 Web 端已有的 38 个工具装进手机，收藏跨设备同步。
**业务逻辑一行都不在这里重写**：工具纯函数、API 客户端、收藏同步、i18n 文案
全部来自 `shared/`。

## 目录约定

```
app/                 Expo Router 路由（约定式，文件名即路径）
  _layout.tsx        根布局：Provider 装配
  index.tsx          工具列表
  login.tsx          登录（密码 / 设备码两条通道）
  favorites.tsx      收藏（增量拉取 + 离线队列同步）
  settings.tsx       账号、语言、运行环境
  tools/[id].tsx     工具页：按 ToolDefinition.inputs 生成表单
src/
  auth/              Bearer 凭证：SecureStore 存储 + 登录流程
  i18n/              shared/messages 四语种查找 + 语言偏好
  runtime/           API 装配 / ToolContext / 工具执行
  ui/                纯展示组件
```

> `apps/*` 下禁止出现 `hooks/ constants/ utils/ validators/ messages/ lib/` 目录
> （`scripts/check-structure.sh` 会扫）。非 UI 通用代码一律从 `shared/` 导入。
> 因此这里刻意使用 `auth/ i18n/ runtime/ ui/` 这套目录名。

## 运行

```bash
# 站点 API 基址必须显式配置，否则 App 会停在「未配置」状态（禁止非空 fallback）
export EXPO_PUBLIC_AAIGC_API_BASE_URL=https://<站点 origin>

pnpm --filter app start      # Expo dev server
pnpm --filter app typecheck  # tsc --noEmit
```

`EXPO_PUBLIC_*` 由 Metro 在打包时静态内联，**不要**用计算属性读取
（`process.env[name]` 不会被内联，运行时拿到的是 undefined）。

## 工具运行时

| tier | 执行方式 | 说明 |
| --- | --- | --- |
| T1 / T2 | 本地 `runToolById()` | 纯计算，走 `shared/tools/registry.ts` |
| T3 | 站点 API 远程执行 | 端点列表在服务端 env，客户端不持有第三方域名 |

`ToolContext` 由 `src/runtime/tool-context.ts` 真实注入：
时区取 `Intl.DateTimeFormat().resolvedOptions().timeZone`，
随机源取 `expo-crypto` 的 CSPRNG（`globalThis.crypto` 在 Hermes 上不保证存在，
所以绝不依赖 `shared` 的默认随机源）。
