//! 系统托盘。
//!
//! 主窗口「关闭」时收进托盘（见 lib.rs 的窗口事件处理），这里提供把它叫回来
//! 和真正退出的入口。菜单标签走 `locale` 表，语言切换时由 `refresh()` 重建。

use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent, TrayIconId};
use tauri::{AppHandle, Manager, Runtime};

use crate::locale::{self, Msg};
use crate::site;
use crate::windows;

const TRAY_ID: &str = "aaigc-tray";
const SHOW_MAIN: &str = "aaigc.tray.show_main";
const OPEN_IN_BROWSER: &str = "aaigc.tray.open_in_browser";
const QUIT: &str = "aaigc.tray.quit";

fn menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    MenuBuilder::new(app)
        .item(&MenuItemBuilder::with_id(SHOW_MAIN, locale::tr(Msg::TrayOpenMain)).build(app)?)
        .item(
            &MenuItemBuilder::with_id(OPEN_IN_BROWSER, locale::tr(Msg::TrayOpenInBrowser))
                .build(app)?,
        )
        .separator()
        .item(&MenuItemBuilder::with_id(QUIT, locale::tr(Msg::TrayQuit)).build(app)?)
        .build()
}

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let tray_menu = menu(app)?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&tray_menu)
        .tooltip("AAIGC")
        // 左键留给「把窗口叫回来」，菜单走右键；Linux 上不受支持，菜单仍会照常弹出。
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            SHOW_MAIN => windows::show_main(app),
            OPEN_IN_BROWSER => site::open_in_browser(app, &site::origin()),
            QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                windows::show_main(tray.app_handle());
            }
        });

    // 复用打包时嵌入的窗口图标，不额外维护一份托盘图标资源。
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;

    Ok(())
}

/// 按当前语言重建托盘菜单（壳 UI 同步系统语言时调用）。
pub fn refresh<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(tray) = app.tray_by_id(&TrayIconId::from(TRAY_ID)) {
        tray.set_menu(Some(menu(app)?))?;
    }

    Ok(())
}
