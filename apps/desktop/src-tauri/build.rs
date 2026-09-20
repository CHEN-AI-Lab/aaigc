//! 构建期注入站点地址。
//!
//! 桌面端的站点地址**只有一个来源**：环境变量 `NEXT_PUBLIC_APP_URL`，
//! 与 `shared/constants/domains.ts` 的 `siteOrigin()` 读的是同一个变量。
//!
//! 这里刻意在**构建期**校验并在缺失 / 非法时直接让 `cargo build` 失败：
//! 桌面端不做非空 fallback（SK-8），宁可编不出来，也不要打出一个会打开
//! 错误地址的包。

use url::Url;

const ENV_SITE_ORIGIN: &str = "NEXT_PUBLIC_APP_URL";

fn main() {
    println!("cargo:rerun-if-env-changed={ENV_SITE_ORIGIN}");

    let raw = std::env::var(ENV_SITE_ORIGIN).unwrap_or_default();
    let trimmed = raw.trim().trim_end_matches('/');

    if trimmed.is_empty() {
        panic!(
            "构建失败：未配置 {ENV_SITE_ORIGIN}。\n\
             桌面端不提供默认站点地址（SK-8：禁止非空 fallback）。\n\
             请在构建前显式注入，例如：\n\
             \x20 {ENV_SITE_ORIGIN}=https://your-domain.example pnpm --filter desktop build"
        );
    }

    let parsed = match Url::parse(trimmed) {
        Ok(url) => url,
        Err(error) => panic!("构建失败：{ENV_SITE_ORIGIN} 不是合法 URL（{error}）：{trimmed}"),
    };

    match parsed.scheme() {
        "http" | "https" => {}
        other => panic!(
            "构建失败：{ENV_SITE_ORIGIN} 的 scheme 必须是 http 或 https，实际是 {other}：{trimmed}"
        ),
    }

    let Some(host) = parsed.host_str() else {
        panic!("构建失败：{ENV_SITE_ORIGIN} 缺少主机名：{trimmed}");
    };

    let port = parsed
        .port_or_known_default()
        .expect("http / https 一定有默认端口");

    println!("cargo:rustc-env=AAIGC_SITE_ORIGIN={trimmed}");
    println!("cargo:rustc-env=AAIGC_SITE_HOST={host}");
    println!("cargo:rustc-env=AAIGC_SITE_PORT={port}");

    tauri_build::build()
}
