//! 应用菜单。
//!
//! 按各平台惯例拆：macOS 走「App 菜单 + 编辑菜单 + 文件菜单」，Windows / Linux
//! 走「文件菜单 + 帮助菜单」。
//!
//! 标签语言：`setup()` 建菜单时壳 UI 还没跑起来，取不到系统语言，所以先按产品
//! 默认语言（`en`，与 `shared/constants/locales.ts` 的 `defaultLocale` 一致）建一套；
//! 壳 UI 加载后会调 `locale::set_locale`，再由 `refresh()` 按系统语言重建。

use tauri::menu::{
    Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder,
};
#[cfg(target_os = "macos")]
use tauri::menu::AboutMetadata;
use tauri::{AppHandle, Runtime};
#[cfg(target_os = "macos")]
use tauri::Manager;

use crate::locale::{self, Msg};
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

/// 按当前语言重建应用菜单（壳 UI 同步系统语言时调用）。
pub fn refresh<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // set_menu 返回被替换掉的旧菜单，这里不需要，显式丢弃。
    let _ = app.set_menu(build(app)?)?;

    Ok(())
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

    let about_label = locale::tr(Msg::MenuAbout);
    let check_updates_label = locale::tr(Msg::MenuCheckUpdates);
    let settings_label = locale::tr(Msg::MenuSettings);
    let quit_label = locale::tr(Msg::MenuQuit);

    SubmenuBuilder::new(app, "AAIGC")
        .item(&PredefinedMenuItem::about(
            app,
            Some(about_label.as_str()),
            Some(about_metadata),
        )?)
        .item(&MenuItemBuilder::with_id(CHECK_UPDATES, check_updates_label).build(app)?)
        .separator()
        .item(
            &MenuItemBuilder::with_id(SETTINGS, settings_label)
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
        .item(&PredefinedMenuItem::quit(app, Some(quit_label.as_str()))?)
        .build()
}

#[cfg(target_os = "macos")]
fn edit_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(app, locale::tr(Msg::MenuEdit))
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
    let open_main_label = locale::tr(Msg::MenuOpenMain);
    let open_in_browser_label = locale::tr(Msg::MenuOpenInBrowser);
    let quit_label = locale::tr(Msg::MenuQuit);

    let submenu = SubmenuBuilder::new(app, locale::tr(Msg::MenuFile))
        .item(
            &MenuItemBuilder::with_id(OPEN_MAIN, open_main_label)
                .accelerator("CmdOrCtrl+1")
                .build(app)?,
        )
        .item(&MenuItemBuilder::with_id(OPEN_IN_BROWSER, open_in_browser_label).build(app)?)
        .separator();

    // macOS 的「设置…」按惯例放在 App 菜单里，不重复出现。
    #[cfg(not(target_os = "macos"))]
    let submenu = submenu.item(
        &MenuItemBuilder::with_id(SETTINGS, locale::tr(Msg::MenuSettings))
            .accelerator("CmdOrCtrl+,")
            .build(app)?,
    );
    #[cfg(not(target_os = "macos"))]
    let submenu = submenu.separator();

    submenu
        .item(&PredefinedMenuItem::quit(app, Some(quit_label.as_str()))?)
        .build()
}

#[cfg(not(target_os = "macos"))]
fn help_submenu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    SubmenuBuilder::new(app, locale::tr(Msg::MenuHelp))
        .item(&MenuItemBuilder::with_id(ABOUT, locale::tr(Msg::MenuAbout)).build(app)?)
        .item(
            &MenuItemBuilder::with_id(CHECK_UPDATES, locale::tr(Msg::MenuCheckUpdates)).build(app)?,
        )
        .build()
}
