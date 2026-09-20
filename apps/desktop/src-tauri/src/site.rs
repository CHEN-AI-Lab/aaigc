//! 站点地址与「能否连上」的判断。
//!
//! 站点地址来自 `build.rs` 在**构建期**注入的常量（源头是 `NEXT_PUBLIC_APP_URL`）。
//! 这里没有任何硬编码域名，也没有非空 fallback —— 没配置就编不出来。
//!
//! 这里返回给壳 UI 的错误文案（探测失败原因、外链被拒原因）会显示在本地
//! 「无法连接」页或面板状态行上，所以走 `locale` 表；纯调试用的 `eprintln!`
//! 保持中文，不进表（见 `apps/desktop/README.md` 的豁免说明）。

use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;

use tauri::{AppHandle, Runtime};
use tauri_plugin_opener::OpenerExt;
use url::Url;

use crate::locale::{self, Msg};

/// 站点 origin（无末尾斜杠），构建期注入。
pub const SITE_ORIGIN: &str = env!("AAIGC_SITE_ORIGIN");

const SITE_HOST: &str = env!("AAIGC_SITE_HOST");
const SITE_PORT: &str = env!("AAIGC_SITE_PORT");

/// 连接探测超时。只用于回答「现在能不能连上」，不做重试。
const PROBE_TIMEOUT: Duration = Duration::from_secs(5);

/// 把构建期注入的 origin 解析成 `Url`。
///
/// `build.rs` 已经校验过合法性，走到运行时还失败说明注入被绕过，直接 panic
/// 比继续用一个坏地址更诚实。
pub fn origin() -> Url {
    Url::parse(SITE_ORIGIN).expect("build.rs 已校验 AAIGC_SITE_ORIGIN 是合法的 http(s) URL")
}

/// 用系统默认浏览器（或默认应用）打开一个链接。
///
/// 只放行 `http` / `https` / `mailto` / `tel`，其余协议一律拒绝：
/// 远程站点是我们不完全控制的内容，不能让它顺手唤起任意本机协议处理器。
pub fn open_in_browser<R: Runtime>(app: &AppHandle<R>, url: &Url) {
    match url.scheme() {
        "http" | "https" | "mailto" | "tel" => {
            if let Err(error) = app.opener().open_url(url.as_str(), None::<&str>) {
                eprintln!("用系统默认应用打开 {url} 失败：{error}");
            }
        }
        other => eprintln!("拒绝用系统默认应用打开非白名单协议：{other}（{url}）"),
    }
}

/// 站点地址（壳 UI 用来跟自己的构建期常量比对，防止两次构建注入不一致）。
#[tauri::command]
pub fn site_origin() -> &'static str {
    SITE_ORIGIN
}

/// 探测站点是否可达。
///
/// 用一次带超时的 TCP 连接来判断「能不能连上」，而不是让 webview 发请求：
/// webview 里发请求意味着要给 CSP 的 `connect-src` 放开站点 origin，
/// 而那段 CSP 是静态的、写不进构建期注入的地址。TCP 探测不需要任何额外权限。
#[tauri::command]
pub async fn probe_site() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(probe)
        .await
        .map_err(|error| {
            locale::tr_args(Msg::ErrConnectProbeFailed, &[("error", &error.to_string())])
        })?
}

/// 在外壳自带的界面上，把链接交给系统默认浏览器。
#[tauri::command]
pub fn open_external(app: AppHandle, url: String) -> Result<(), String> {
    let parsed = Url::parse(&url)
        .map_err(|error| locale::tr_args(Msg::ErrInvalidLink, &[("error", &error.to_string())]))?;

    match parsed.scheme() {
        "http" | "https" | "mailto" | "tel" => {}
        other => {
            return Err(locale::tr_args(
                Msg::ErrSchemeNotAllowed,
                &[("scheme", other)],
            ))
        }
    }

    app.opener()
        .open_url(parsed.as_str(), None::<&str>)
        .map_err(|error| {
            locale::tr_args(Msg::ErrOpenExternalFailed, &[("error", &error.to_string())])
        })
}

fn probe() -> Result<(), String> {
    let port: u16 = SITE_PORT
        .parse()
        .map_err(|_| locale::tr_args(Msg::ErrInvalidSitePort, &[("port", SITE_PORT)]))?;

    let addrs = (SITE_HOST, port).to_socket_addrs().map_err(|error| {
        locale::tr_args(
            Msg::ErrResolveSiteHost,
            &[("host", SITE_HOST), ("error", &error.to_string())],
        )
    })?;

    let mut last_error: Option<String> = None;

    for addr in addrs {
        match TcpStream::connect_timeout(&addr, PROBE_TIMEOUT) {
            Ok(_) => return Ok(()),
            // 这里是「地址 + 系统错误」的原始细节，会作为 {error} 嵌进上面那条
            // 已本地化的文案里，所以分隔符用中性 ASCII 冒号，不掺中文标点。
            Err(error) => last_error = Some(format!("{addr}: {error}")),
        }
    }

    Err(match last_error {
        Some(error) => locale::tr_args(
            Msg::ErrConnectFailed,
            &[("host", SITE_HOST), ("port", SITE_PORT), ("error", &error)],
        ),
        None => locale::tr_args(
            Msg::ErrNoResolvedAddress,
            &[("host", SITE_HOST), ("port", SITE_PORT)],
        ),
    })
}
