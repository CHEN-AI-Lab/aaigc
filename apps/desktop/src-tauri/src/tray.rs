//! 系统托盘。
//!
//! 主窗口「关闭」时收进托盘（见 lib.rs 的窗口事件处理），这里提供把它叫回来
//! 和真正退出的入口。

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Runtime};

use crate::site;
use crate::windows;

const TRAY_ID: &str = "aaigc-tray";
const SHOW_MAIN: &str = "aaigc.tray.show_main";
const OPEN_IN_BROWSER: &str = "aaigc.tray.open_in_browser";
const QUIT: &str = "aaigc.tray.quit";

pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = MenuBuilder::new(app)
        .item(&MenuItemBuilder::with_id(SHOW_MAIN, "打开主界面").build(app)?)
        .item(&MenuItemBuilder::with_id(OPEN_IN_BROWSER, "在浏览器中打开").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id(QUIT, "退出 AAIGC").build(app)?)
        .build()?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
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
