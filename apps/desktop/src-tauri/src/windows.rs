//! 窗口创建与导航策略。
//!
//! 两类窗口：
//!   * `main` —— 壳主窗口。先加载本地壳页面（`index.html`），由壳页面探测站点
//!     可达后自行导航到远程站点；连不上就停在本地「无法连接」页。
//!   * `settings` / `about` —— 本地面板窗口，永远只加载本地资源。
//!
//! 导航策略统一走导航守卫：只放行本地壳资源与站点同源地址，其余一律交给
//! 系统默认浏览器 —— 这样用户在壳里不会「迷路」到一个没有后退按钮的陌生页面。

use tauri::webview::{NewWindowFeatures, NewWindowResponse};
use tauri::{AppHandle, Manager, Runtime, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use url::Url;

use crate::site;

pub const MAIN: &str = "main";
pub const SETTINGS: &str = "settings";
pub const ABOUT: &str = "about";

/// 主窗口：几何配置取自 `tauri.conf.json` 的 `app.windows`（那里标了
/// `create: false`，由这里显式创建，好挂上导航守卫）。
pub fn create_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<WebviewWindow<R>> {
    let config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == MAIN)
        .cloned()
        .expect("tauri.conf.json 必须声明 label = \"main\" 的窗口配置");

    let site_origin = site::origin();
    let navigation_handle = app.clone();
    let new_window_handle = app.clone();

    WebviewWindowBuilder::from_config(app, &config)?
        .on_navigation(move |url| {
            if is_shell_url(url) || is_site_url(url, &site_origin) {
                return true;
            }
            // 外链不留在壳里：交给系统默认浏览器，本窗口保持原状。
            site::open_in_browser(&navigation_handle, url);
            false
        })
        .on_new_window(move |url, _features: NewWindowFeatures| {
            // 远程站点里的 window.open / target="_blank" 同样外开，不在壳里新开窗口。
            site::open_in_browser(&new_window_handle, &url);
            NewWindowResponse::Deny
        })
        .build()
}

/// 把主窗口从托盘里叫回来。
pub fn show_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// 打开（或前置）一个本地面板窗口。
pub fn show_panel<R: Runtime>(app: &AppHandle<R>, view: &str) -> Result<(), String> {
    let (label, title, width, height) = match view {
        SETTINGS => (SETTINGS, "AAIGC 设置", 620.0, 560.0),
        ABOUT => (ABOUT, "关于 AAIGC", 520.0, 460.0),
        other => return Err(format!("未知面板：{other}")),
    };

    focus_or_create(app, label, title, width, height).map_err(|error| error.to_string())
}

/// 面板窗口的 IPC 入口（壳 UI 里互相跳转用）。
#[tauri::command]
pub fn open_panel(app: AppHandle, view: String) -> Result<(), String> {
    show_panel(&app, &view)
}

fn focus_or_create<R: Runtime>(
    app: &AppHandle<R>,
    label: &str,
    title: &str,
    width: f64,
    height: f64,
) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(label) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    let handle = app.clone();
    let url = format!("index.html?view={label}");

    WebviewWindowBuilder::new(app, label, WebviewUrl::App(url.into()))
        .title(title)
        .inner_size(width, height)
        .min_inner_size(380.0, 320.0)
        .resizable(true)
        .center()
        .on_navigation(move |target| {
            if is_shell_url(target) {
                return true;
            }
            site::open_in_browser(&handle, target);
            false
        })
        .build()?;

    Ok(())
}

/// 是否是外壳自己的本地资源（Tauri 自定义协议 / 开发服务器）。
fn is_shell_url(url: &Url) -> bool {
    match url.scheme() {
        "tauri" => true,
        "http" | "https" => {
            // Windows 上 Tauri 用 http://tauri.localhost 承载本地资源。
            if url.host_str() == Some("tauri.localhost") {
                return true;
            }
            // 开发模式下壳页面来自 vite dev server；只在 debug 构建里放行。
            cfg!(debug_assertions)
                && matches!(url.host_str(), Some("localhost") | Some("127.0.0.1"))
        }
        _ => false,
    }
}

/// 是否与构建期注入的站点同源。
fn is_site_url(url: &Url, site_origin: &Url) -> bool {
    matches!(url.scheme(), "http" | "https") && url.origin() == site_origin.origin()
}
