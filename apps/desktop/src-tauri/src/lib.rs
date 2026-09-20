//! AAIGC 桌面端外壳。
//!
//! 定位：**壳 + 远程站**。这里只做原生外壳（窗口、菜单、托盘、系统集成），
//! 业务界面由线上站点提供，壳本身不重新实现 Web 应用，也不做离线版。
//!
//! 站点地址在构建期由 `build.rs` 从 `NEXT_PUBLIC_APP_URL` 注入（缺失即构建失败），
//! 前端壳页面则由 vite 从 `shared/constants/domains.ts` 注入同一个值。

mod export;
mod locale;
mod menu;
mod site;
mod tray;
mod windows;

use tauri::WindowEvent;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        // 关掉 opener 插件自带的「点击 _blank 链接自动外开」注入脚本。
        // 那个脚本要靠 IPC 权限才能工作，等于给 webview（含远程站点）
        // 开一个 opener:allow-open-url 的口子。外链改由 Rust 侧统一处理，
        // webview 侧因此不需要任何 opener 权限。
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            site::site_origin,
            site::probe_site,
            site::open_external,
            export::export_diagnostics,
            windows::open_panel,
            locale::set_locale,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // 先建窗口再装菜单：非 macOS 平台 set_menu 会把菜单铺到已有窗口上。
            windows::create_main_window(&handle)?;
            app.set_menu(menu::build(&handle)?)?;
            tray::build(&handle)?;

            Ok(())
        })
        .on_menu_event(|app, event| menu::handle_event(app, event.id().as_ref()))
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == windows::MAIN {
                    // 主窗口「关闭」= 收进托盘，不退出应用；
                    // 真退出走菜单 / 托盘里的显式入口（app.exit）。
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("AAIGC 桌面端外壳启动失败");
}
