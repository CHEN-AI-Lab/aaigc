//! 应用菜单。
//!
//! 按各平台惯例拆：macOS 走「App 菜单 + 编辑菜单 + 文件菜单」，Windows / Linux
//! 走「文件菜单 + 帮助菜单」。菜单标签用产品默认语言（zh-CN），跟站点默认语言一致。

use tauri::menu::{
    Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder,
};
#[cfg(target_os = "macos")]
use tauri::menu::AboutMetadata;
use tauri::{AppHandle, Runtime};
#[cfg(target_os = "macos")]
use tauri::Manager;

use crate::site;
use crate::windows;

const OPEN_MAIN: &str = "aaigc.menu.open_main";
const OPEN_IN_BROWSER: &str = "aaigc.menu.open_in_browser";
const SETTINGS: &str = "aaigc.menu.settings";
const ABOUT: &str = "aaigc.menu.about";
const CHECK_UPDATES: &str = "aaigc.menu.check_updates";

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    // 先把子菜单绑成局部变量，再挂到主菜单上，避免依赖临时值的生命周期。
    #[cfg(target_os = "macos")]
    let app_menu = app_submenu(app)?;
    #[cfg(target_os = "macos")]
    let edit_menu = edit_submenu(app)?;

    let file_menu = file_submenu(app)?;

    #[cfg(not(target_os = "macos"))]
    let help_menu = help_submenu(app)?;

    let menu = MenuBuilder::new(app);

    #[cfg(target_os = "macos")]
    let menu = menu.item(&app_menu);
    #[cfg(target_os = "macos")]
    let menu = menu.item(&edit_menu);

    let menu = menu.item(&file_menu);

    #[cfg(not(target_os = "macos"))]
    let menu = menu.item(&help_menu);

    menu.build()
}

pub fn handle_event<R: Runtime>(app: &AppHandle<R>, id: &str) {
    match id {
        OPEN_MAIN => windows::show_main(app),
        OPEN_IN_BROWSER => open_current(app),
        SETTINGS => log_panel_result(windows::show_panel(app, windows::SETTINGS)),
        // 「检查更新」只做入口：打开关于面板，那里有明确标注为占位的检查更新按钮。
        ABOUT | CHECK_UPDATES => log_panel_result(windows::show_panel(app, windows::ABOUT)),
        _ => {}
    }
}

/// 打开「当前页」：主窗口已经在站点上就用它的地址，否则退回站点 origin。
fn open_current<R: Runtime>(app: &AppHandle<R>) {
    let target = app
        .get_webview_window(windows::MAIN)
        .and_then(|window| window.url().ok())
        .filter(|url| matches!(url.scheme(), "http" | "https"))
        .unwrap_or_else(site::origin);

    site::open_in_browser(app, &target);
}

fn log_panel_result(result: Result<(), String>) {
    if let Err(error) = result {
        eprintln!("打开面板失败：{error}");
    }
}

#[cfg(target_os = "macos")]
fn app_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let about_metadata = AboutMetadata {
        name: Some("AAIGC".to_string()),
        version: Some(app.package_info().version.to_string()),
        ..AboutMetadata::default()
    };

    SubmenuBuilder::new(app, "AAIGC")
        .item(&PredefinedMenuItem::about(
            app,
            Some("关于 AAIGC"),
            Some(about_metadata),
        )?)
        .item(&MenuItemBuilder::with_id(CHECK_UPDATES, "检查更新…").build(app)?)
        .separator()
        .item(
            &MenuItemBuilder::with_id(SETTINGS, "设置…")
                .accelerator("CmdOrCtrl+,")
                .build(app)?,
        )
        .separator()
        .item(&PredefinedMenuItem::services(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, None)?)
        .item(&PredefinedMenuItem::hide_others(app, None)?)
        .item(&PredefinedMenuItem::show_all(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some("退出 AAIGC"))?)
        .build()
}

#[cfg(target_os = "macos")]
fn edit_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(app, "编辑")
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .build()
}

fn file_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let submenu = SubmenuBuilder::new(app, "文件")
        .item(
            &MenuItemBuilder::with_id(OPEN_MAIN, "打开主界面")
                .accelerator("CmdOrCtrl+1")
                .build(app)?,
        )
        .item(&MenuItemBuilder::with_id(OPEN_IN_BROWSER, "在浏览器中打开当前页").build(app)?)
        .separator();

    // macOS 的「设置…」按惯例放在 App 菜单里，不重复出现。
    #[cfg(not(target_os = "macos"))]
    let submenu = submenu.item(
        &MenuItemBuilder::with_id(SETTINGS, "设置…")
            .accelerator("CmdOrCtrl+,")
            .build(app)?,
    );
    #[cfg(not(target_os = "macos"))]
    let submenu = submenu.separator();

    submenu
        .item(&PredefinedMenuItem::quit(app, Some("退出 AAIGC"))?)
        .build()
}

#[cfg(not(target_os = "macos"))]
fn help_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(app, "帮助")
        .item(&MenuItemBuilder::with_id(ABOUT, "关于 AAIGC").build(app)?)
        .item(&MenuItemBuilder::with_id(CHECK_UPDATES, "检查更新…").build(app)?)
        .build()
}
