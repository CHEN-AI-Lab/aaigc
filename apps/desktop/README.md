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
    ├── icons/            # 应用图标（由 tauri icon 生成）
    └── src/              # main / lib / locale / menu / tray / windows / site / export
```

完整的文件清单与逐文件符号清单见文末「符号索引」。

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

**语言清单只有两处**：`shared/constants/locales.ts` 的 `locales`（真源）与
`src-tauri/src/locale.rs` 的 `SUPPORTED`。壳 UI 侧**不写死数组** —— `src/shell/i18n.ts`
的 `DESKTOP_LOCALES` 是 `Object.keys(__DESKTOP_MESSAGES__)` 推出来的，不存在第三份副本。
两处的一致性由 `scripts/check-desktop-locale-sync.sh` 兜住：`locale.rs` 的 `match`
负责「表内不缺项」（漏一条编译不过），脚本负责「语言集合不脱节」。

`desktop.*` 命名空间的 key 以**一次性 payload 文件**（`_desktop_messages_payload.json`）
提交、由维护者合并进 `shared/messages/*.json` 后即删除 —— **该文件不在仓库里，别去找它。**
合并之前 `vite build` 会因「缺 `desktop` 命名空间」直接失败，这是刻意的，
避免壳 UI 悄悄退回硬编码文案。

`src-tauri/tauri.conf.json` 的 `shortDescription` / `longDescription` 固定写英文：
它们出现在安装器与系统应用列表里，而 Tauri 的 bundle 元数据是**静态**的、只有
per-platform 覆盖、没有 per-locale 机制，所以按产品默认语言 `en` 写。

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
* **应用自定义命令不走 ACL**：本项目的 6 个 `#[tauri::command]` 因此一条都不在
  capabilities 里声明（capability 只管插件命令）。完整清单见文末「符号索引」。

## 命令

```bash
pnpm --filter desktop typecheck   # 壳 UI 类型检查
pnpm --filter desktop dev         # tauri dev（需要 Rust 工具链 + 平台原生依赖）
pnpm --filter desktop build       # tauri build
```

`dev` / `build` 需要 Rust 工具链（`cargo`）以及平台原生依赖：
Windows 需要 WebView2 + MSVC，Linux 需要 `webkit2gtk-4.1`，macOS 需要 Xcode。

> **当前仓库无 `Cargo.lock`，Rust 侧从未做过任何构建验证。**
> 本机的 `cargo` / `rustc` / `rustup` 均不可用，Linux 侧原生依赖
> （`pkg-config`、`webkit2gtk-4.1`、`libsoup-3.0`）也不存在。
> `src-tauri/` 下所有 Rust 代码处于**未编译验证**状态，首次在有工具链的机器上
> `cargo build` 前请预期会有编译错误需要修。
>
> 壳 UI（`src/**`）不受影响：`pnpm --filter desktop typecheck` 已通过。

---

# 符号索引（review 底稿）

> **这是快照，不是契约。** 行号是核实时刻的值；引用前请用 `file:line` 回查一次。
> 行号漂了但符号还在 → 改行号，别改符号名；符号不在了 → 说明代码变了，这份表该更新。
>
> 生成方式：逐文件 `Grep` + `Read` 核实，**没有一处从目录名推断**。
> 之所以把**私有**符号也列出来：从目录名反推函数名是最常见的引用错误来源，
> 而私有符号恰恰是 grep 导出时最容易漏掉的一类。

## 文件清单（54 个）

| 位置 | 文件 |
| --- | --- |
| 根（7） | `package.json` · `tsconfig.json` · `tsconfig.node.json` · `vite.config.ts` · `index.html` · `README.md` · `.gitignore` |
| `src/`（4） | `main.tsx` · `App.tsx` · `styles.css` · `vite-env.d.ts` |
| `src/shell/`（6） | `connect.ts` · `diagnostics.ts` · `error-text.ts` · `i18n.ts` · `native.ts` · `notify.ts` |
| `src/components/`（3） | `ActionButton.tsx` · `CheckUpdatesButton.tsx` · `PanelFrame.tsx` |
| `src/views/`（4） | `AboutView.tsx` · `OfflineView.tsx` · `SettingsView.tsx` · `ShellView.tsx` |
| `src-tauri/`（5） | `build.rs` · `Cargo.toml` · `tauri.conf.json` · `.gitignore` · `capabilities/default.json` |
| `src-tauri/icons/`（17） | 15 个 PNG（`32x32` / `64x64` / `128x128` / `128x128@2x` / `icon` / `StoreLogo` / `Square30x30` … `Square310x310`）+ `icon.icns` + `icon.ico` |
| `src-tauri/src/`（8） | `main.rs` · `lib.rs` · `menu.rs` · `tray.rs` · `windows.rs` · `site.rs` · `export.rs` · `locale.rs` |

## 壳 UI 符号

### `src/` 层

| 文件 | 导出 | 私有 |
| --- | --- | --- |
| `src/main.tsx` | **无导出**（22 行，无函数定义） | `container` (:8) |
| `src/App.tsx` | `App` (:10) | — |
| `src/styles.css` | 无（Tailwind 入口，`@import 'tailwindcss'`） | — |
| `src/vite-env.d.ts` | 无（只有全局声明，见下节） | — |

### `src/shell/`

| 文件 | 导出 | 私有 |
| --- | --- | --- |
| `connect.ts` | `ConnectResult`（type, :5）· `connectToSite()` (:19) | — |
| `diagnostics.ts` | `buildDiagnostics()` (:13) | `probeAndReport()` (:27) · `describe()` (:32) |
| `error-text.ts` | `errorText()` (:7) | — |
| `i18n.ts` | `DESKTOP_LOCALES` (:21) · `isDesktopLocale()` (:23) · `resolveLocale()` (:33) · `activeLocale()` (:101) · `t()` (:111) · `syncNativeLocale()` (:133) | `matchLocale()` (:41) · `DEFAULT_LOCALE` (:71) · `ACTIVE_LOCALE` (:82) |
| `native.ts` | `PanelView`（type, :4）· `getSiteOrigin()` (:7) · `probeSite()` (:12) · `openExternal()` (:17) · `openPanel()` (:22) · `exportDiagnostics()` (:30) | — |
| `notify.ts` | `notify()` (:16) | — |

### `src/components/`

| 文件 | 导出 | 私有 |
| --- | --- | --- |
| `ActionButton.tsx` | `ActionButton` (:18) | `ActionButtonProps`（type, :3）· `BASE` (:9) · `TONES` (:12) |
| `CheckUpdatesButton.tsx` | `CheckUpdatesButton` (:15) | — |
| `PanelFrame.tsx` | `PanelFrame` (:14) · `PanelSection` (:43) · `PanelField` (:56) | `PanelFrameProps` (:7) · `PanelSectionProps` (:37) |

### `src/views/`

| 文件 | 导出 | 私有 |
| --- | --- | --- |
| `AboutView.tsx` | `AboutView` (:12) | — |
| `OfflineView.tsx` | `OfflineView` (:14) | `OfflineViewProps` (:8) |
| `SettingsView.tsx` | `SettingsView` (:13) | — |
| `ShellView.tsx` | `ShellView` (:16) | `Phase`（type, :7）· `ConnectingView` (:66) |

## 全局声明（不是 export，grep 导出扫不到，但删了直接编译报错）

这三个由 `vite.config.ts` 的 `define`（:124-126）在构建期替换成字面量，
`src/vite-env.d.ts` 只负责给它们类型。

| 全局符号 | 声明 | 引用点 |
| --- | --- | --- |
| `__SITE_ORIGIN__: string` | `vite-env.d.ts:13` | `connect.ts:28` · `connect.ts:31` · `diagnostics.ts:18` · `OfflineView.tsx:21` · `SettingsView.tsx:54` · `AboutView.tsx:43` · `AboutView.tsx:49` |
| `__DESKTOP_MESSAGES__: Readonly<Record<string, Readonly<Record<string, string>>>>` | `vite-env.d.ts:21` | `i18n.ts:21` · `i18n.ts:112` · `i18n.ts:114` |
| `__DESKTOP_DEFAULT_LOCALE__: string` | `vite-env.d.ts:27` | `i18n.ts:72` |

## 外壳符号（Rust）

| 文件 | 导出（`pub`） | 私有 |
| --- | --- | --- |
| `main.rs` | 无 | `main()` (:4) |
| `lib.rs` | `run()` (:18) | `mod export/locale/menu/site/tray/windows` (:9-14) |
| `menu.rs` | `build()` (:29) · `refresh()` (:57) · `handle_event()` (:64) | `OPEN_MAIN` `OPEN_IN_BROWSER` `SETTINGS` `ABOUT` `CHECK_UPDATES` (:23-27) · `open_current()` (:76) · `log_panel_result()` (:86) · `app_submenu()` (:93) · `edit_submenu()` (:130) · `file_submenu()` (:142) · `help_submenu()` (:172) |
| `tray.rs` | `build()` (:31) · `refresh()` (:67) | `TRAY_ID` (:14) · `SHOW_MAIN` `OPEN_IN_BROWSER` `QUIT` (:15-17) · `menu()` (:19) |
| `windows.rs` | `MAIN` (:21) · `SETTINGS` (:22) · `ABOUT` (:23) · `create_main_window()` (:27) · `show_main()` (:59) · `show_panel()` (:68) · `open_panel()` (:80) | `focus_or_create()` (:84) · `is_shell_url()` (:120) · `is_site_url()` (:137) |
| `site.rs` | `SITE_ORIGIN` (:20) · `origin()` (:32) · `open_in_browser()` (:40) · `site_origin()` (:53) · `probe_site()` (:63) · `open_external()` (:73) | `SITE_HOST` (:22) · `SITE_PORT` (:23) · `PROBE_TIMEOUT` (:26) · `probe()` (:94) |
| `export.rs` | `export_diagnostics()` (:20) | — |
| `locale.rs` | `Msg`（enum, :34）· `normalize()` (:195) · `set_active()` (:227) · `tr()` (:260) · `tr_args()` (:265) · `set_locale()` (:275) | `SUPPORTED` (:21) · `DEFAULT` (:27) · `translations()` (:72) · `ACTIVE` (:189) · `active()` (:221) · `locale_index()` (:235) · `render()` (:243) |

## Tauri 命令 ↔ 壳 UI 调用点（6 ↔ 6，1:1 对齐）

Rust 侧 6 个 `#[tauri::command]` 与壳 UI 侧 6 个 `invoke()` 完全对应，无孤儿、无缺失。
这也是「桌面端到底暴露了什么给壳 UI」的完整答案。

| 命令 | Rust 定义 | 壳 UI 调用点 |
| --- | --- | --- |
| `site_origin` | `site.rs:52-53` | `native.ts:7` `getSiteOrigin()` |
| `probe_site` | `site.rs:62-63` | `native.ts:12` `probeSite()` |
| `open_external` | `site.rs:72-73` | `native.ts:17` `openExternal()` |
| `export_diagnostics` | `export.rs:19-20` | `native.ts:30` `exportDiagnostics()` |
| `open_panel` | `windows.rs:79-80` | `native.ts:22` `openPanel()` |
| `set_locale` | `locale.rs:274-275` | `i18n.ts:133` `syncNativeLocale()` |

这 6 个命令**都不在 capabilities 里声明**（应用自定义命令不走 ACL）；
capabilities 只声明插件权限，清单见上文「安全模型」。
