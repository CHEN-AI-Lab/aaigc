//! 诊断报告导出。
//!
//! 保存对话框与写文件都放在 Rust 侧，壳 UI 只是把文本递进来。
//! 这样 webview 完全不需要 `dialog:*` / `fs:*` 权限，capabilities 里
//! 因此一条 dialog 权限都不用声明。
//!
//! 只有本地壳页面能调到这里：Tauri 2 对**非本地来源**的 IPC 请求会强制走 ACL，
//! 而本 capability 没有配置任何 `remote` 来源，所以远程站点够不到这个命令。

use std::fs;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::locale::{self, Msg};

/// 弹出原生保存对话框并写入诊断报告。
/// 返回落盘路径；用户取消时返回 `null`。
#[tauri::command]
pub async fn export_diagnostics(
    app: AppHandle,
    content: String,
) -> Result<Option<String>, String> {
    // blocking_save_file 内部是「发起异步对话框 + 阻塞当前线程等回调」，
    // 因此只能放在非主线程上跑 —— async 命令正好满足。
    let picked = app
        .dialog()
        .file()
        .set_title(locale::tr(Msg::DialogSaveDiagnostics))
        .set_file_name("aaigc-desktop-diagnostics.md")
        .add_filter("Markdown", &["md"])
        .blocking_save_file();

    let Some(file_path) = picked else {
        return Ok(None);
    };

    let path = file_path.into_path().map_err(|error| {
        locale::tr_args(Msg::ErrResolveSavePath, &[("error", &error.to_string())])
    })?;

    let display = path.display().to_string();

    fs::write(&path, content).map_err(|error| {
        locale::tr_args(
            Msg::ErrWriteFile,
            &[("path", &display), ("error", &error.to_string())],
        )
    })?;

    Ok(Some(display))
}
