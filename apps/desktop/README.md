# AAIGC 桌面端（`apps/desktop`）

**定位：壳 + 远程站。** Tauri 2 提供一个原生外壳（窗口、菜单、托盘、系统级集成），
内容主体是线上站点。这里**不**重新实现 Web 应用，也**不**做离线版。

## 结构

```
apps/desktop/
├── index.html            # 壳 UI 入口
├── vite.config.ts        # 构建期注入站点地址 + 读取 tauri.conf.json 的 devUrl
├── src/                  # 壳 UI（React + TS + Tailwind 4）
│   ├── shell/            # 与外壳通信、连接探测、诊断、通知
│   ├── components/       # 少量共用 UI
│   └── views/            # 连接壳 / 无法连接 / 设置 / 关于
└── src-tauri/            # Rust 侧
    ├── build.rs          # 构建期注入站点地址（缺失即构建失败）
    ├── tauri.conf.json   # 窗口、CSP、bundle
    ├── capabilities/     # 最小权限声明
    └── src/              # main / lib / locale / menu / tray / windows / site / export
```

## 文案与语言

壳 UI 支持 `en` / `zh-CN` / `zh-TW` / `ja`，语言集合与默认语言都取自
`shared/constants/locales.ts`（`locales` / `defaultLocale`）。分两处落地：

| 位置 | 覆盖范围 | 真源 |
| --- | --- | --- |
| `src/**`（TSX） | 壳 UI 页面上的全部文案 | `shared/messages/<locale>.json` 的 `desktop.*`，构建期由 `vite.config.ts` 拍平注入 `__DESKTOP_MESSAGES__` |
| `src-tauri/src/locale.rs` | 原生菜单 / 托盘 / 窗口标题 / 原生对话框 / 面向用户的错误文案 | 内嵌四语种表（原生控件上 TSX 碰不到，见该文件头部说明） |

语言在运行期这样确定：壳 UI 按 `navigator.languages` 逐个匹配（`src/shell/i18n.ts`
的 `resolveLocale()`），命中不了用产品默认语言；随后调 `set_locale` 同步给外壳，
外壳据此重建菜单与托盘、改写面板窗口标题。启动到同步之间菜单短暂使用默认语言，
因为那时页面还没跑起来。

`desktop.*` 命名空间的 key 由 `_desktop_messages_payload.json` 提交、由维护者合并进
`shared/messages/*.json`。合并之前 `vite build` 会因「缺 `desktop` 命名空间」直接失败
—— 这是刻意的，避免壳 UI 悄悄退回硬编码文案。

**豁免说明：`apps/desktop/` 下的代码注释（`//!` / `///` / `//` / `/* */`）一律保持中文。**
注释不是用户可见文案，不进 `shared/messages`，也不参与
`scripts/check-translations.py`（该脚本只读 `shared/messages/*.json` 与
`shared/constants/error-codes.ts`）。同理，Rust 里开发者向的 `panic!` / `expect` /
`eprintln!`（构建期断言、启动失败、外链被拒的调试日志）也不进 `locale.rs` 的表：
它们面向开发者，且多数发生在「文案表本身可能还不可用」的时刻。

## 站点地址是怎么注入的

站点地址**没有**硬编码，也没有任何非空 fallback（SK-8）。它只有一个来源：
环境变量 `NEXT_PUBLIC_APP_URL`，与 `shared/constants/domains.ts` 的
`siteOrigin()` 读的是同一个变量。

有两个**构建期**注入点，两边都缺一不可：

| 侧 | 位置 | 结果 |
| --- | --- | --- |
| 壳 UI | `vite.config.ts` 调 `isSiteOriginConfigured()` / `siteOrigin()` | 注入 `__SITE_ORIGIN__`；未配置则 `vite build` 直接失败 |
| 外壳 | `src-tauri/build.rs` | 注入 `AAIGC_SITE_ORIGIN` 等 `rustc-env`；未配置则 `cargo build` 直接失败 |

两份值在运行时会被比对（`src/shell/connect.ts`），不一致就报配置错误，
而不是随便挑一个继续跑。

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.example pnpm --filter desktop build
```

## 连接流程

1. 主窗口先加载本地壳页面 `index.html`（`tauri.conf.json` 里标了 `create: false`，
   实际由 `windows::create_main_window` 创建，好挂上导航守卫）。
2. 壳页面调 `site_origin` / `probe_site`：比对两侧注入值，再做一次带超时的 TCP 探测。
3. 通过 → `window.location.replace(origin)` 导航到线上站点；
   失败 → 停在本地「无法连接」页，带重试与「在浏览器中打开」。
4. 之后所有导航都过一遍守卫：只有本地壳资源与站点**同源**地址放行，
   其余（含 `target="_blank"` / `window.open`）交给系统默认浏览器。

## 安全模型

* **CSP**（`tauri.conf.json` → `app.security.csp`）只作用于本地壳页面。
  `script-src 'self'`（不开 `unsafe-eval`）、`style-src 'self' 'unsafe-inline'`、
  `object-src` / `frame-src` / `worker-src` / `manifest-src` 全为 `none`。
  远程站点由它自己的 CSP 约束，这里管不到也不该管。
* **capabilities**（`capabilities/default.json`）只声明实际用到的权限：
  `core:app:allow-version`、`core:window:allow-close`、三条 notification 权限。
  没有 `core:default`，没有 `dialog:*`（保存对话框在 Rust 侧完成，webview 用不到）。
* **远程站点拿不到任何原生能力**：capability 只对本地源生效；Tauri 2 对
  **非本地来源**的 IPC 请求会强制走 ACL，而这里没有配置任何 `remote` 来源，
  所以站点页面既调不到插件命令，也调不到本项目的自定义命令。
* **外链协议白名单**：`open_external` 与导航守卫都只放行
  `http` / `https` / `mailto` / `tel`，避免远程内容唤起任意本机协议处理器。

## 命令

```bash
pnpm --filter desktop typecheck   # 壳 UI 类型检查
pnpm --filter desktop dev         # tauri dev（需要 Rust 工具链 + 平台原生依赖）
pnpm --filter desktop build       # tauri build
```

`dev` / `build` 需要 Rust 工具链（`cargo`）以及平台原生依赖：
Windows 需要 WebView2 + MSVC，Linux 需要 `webkit2gtk-4.1`，macOS 需要 Xcode。
