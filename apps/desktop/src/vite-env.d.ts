/// <reference types="vite/client" />

/**
 * 站点 origin（无末尾斜杠）。
 *
 * 构建期由 `vite.config.ts` 从 `shared/constants/domains.ts` 的 `siteOrigin()`
 * 注入，源头是 `NEXT_PUBLIC_APP_URL`；未配置时 `vite build` 直接失败，
 * 所以这里不会出现「空字符串」或某个兜底域名。
 *
 * Rust 侧 `build.rs` 会从同一个环境变量再注入一份（`AAIGC_SITE_ORIGIN`）。
 * 两份必须一致，`src/shell/connect.ts` 会在连接前比对，不一致就报配置错误。
 */
declare const __SITE_ORIGIN__: string
