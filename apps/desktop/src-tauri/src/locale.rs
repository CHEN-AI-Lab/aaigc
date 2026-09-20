//! 外壳原生侧的文案表（菜单 / 托盘 / 窗口标题 / 原生对话框 / 面向用户的错误文案）。
//!
//! 为什么不用 `shared/messages`：那是给各端 JS 用的 JSON，Rust 侧读它要么
//! 引入一个运行时解析器 + 打包一份 JSON，要么在构建期把 JSON 转成 Rust 代码。
//! 原生侧的用户可见文案只有几十条、且大多是「菜单项」这种短标签，直接内嵌一张
//! 四语种表更简单，也不会让 `shared/messages` 变成两端都要解析的隐式契约。
//!
//! **唯一真源仍然是 `shared/messages`**：壳 UI（TSX）那部分文案走
//! `desktop.*` 命名空间，由 vite 构建期注入；这里只覆盖「原生控件上、TSX 碰不到」
//! 的那些字符串。新增文案时两边的语言集合必须同步 —— `SUPPORTED` 与
//! `shared/constants/locales.ts` 的 `locales` 一一对应，`DEFAULT` 对应
//! 那里的 `defaultLocale`。
//!
//! 语言顺序固定为 `["en", "zh-CN", "zh-TW", "ja"]`，表里每条翻译都按这个顺序写。

use std::sync::RwLock;

use tauri::{AppHandle, Manager};

/// 支持的语言，顺序必须与 `shared/constants/locales.ts` 的 `locales` 一致。
const SUPPORTED: [&str; 4] = ["en", "zh-CN", "zh-TW", "ja"];

/// 产品默认语言，必须与 `shared/constants/locales.ts` 的 `defaultLocale` 一致。
///
/// 这个常量**不是**站点地址那样的构建期注入项：它是个语言标识，不是
/// 「不许硬编码」的域名 / URL / 端口，重复一处并注明来源即可。
const DEFAULT: &str = "en";

/// 原生控件上、TSX 碰不到的用户可见文案。
///
/// 只放用户能看到的字符串。开发者向的 `panic!` / `expect` / `eprintln!`
/// 一律不进这张表（见 `apps/desktop/README.md` 的豁免说明）。
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Msg {
    // 应用菜单
    MenuAbout,
    MenuCheckUpdates,
    MenuSettings,
    MenuQuit,
    MenuEdit,
    MenuFile,
    MenuHelp,
    MenuOpenMain,
    MenuOpenInBrowser,
    // 托盘
    TrayOpenMain,
    TrayOpenInBrowser,
    TrayQuit,
    // 窗口标题
    WindowSettings,
    WindowAbout,
    // 原生对话框
    DialogSaveDiagnostics,
    // 面向用户的错误文案
    ErrUnknownPanel,
    ErrConnectProbeFailed,
    ErrInvalidLink,
    ErrSchemeNotAllowed,
    ErrOpenExternalFailed,
    ErrInvalidSitePort,
    ErrResolveSiteHost,
    ErrConnectFailed,
    ErrNoResolvedAddress,
    ErrResolveSavePath,
    ErrWriteFile,
}

/// 每条文案的四语种翻译，顺序同 `SUPPORTED`。
///
/// 用 `match` 而不是 `&[(Msg, [&str; 4])]` 表：漏写一条编译器直接报
/// non-exhaustive，不会退化成「查不到就显示空串」。
fn translations(msg: Msg) -> [&'static str; 4] {
    match msg {
        Msg::MenuAbout => ["About AAIGC", "关于 AAIGC", "關於 AAIGC", "AAIGC について"],
        Msg::MenuCheckUpdates => [
            "Check for Updates…",
            "检查更新…",
            "檢查更新…",
            "アップデートを確認…",
        ],
        Msg::MenuSettings => ["Settings…", "设置…", "設定…", "設定…"],
        Msg::MenuQuit => ["Quit AAIGC", "退出 AAIGC", "結束 AAIGC", "AAIGC を終了"],
        Msg::MenuEdit => ["Edit", "编辑", "編輯", "編集"],
        Msg::MenuFile => ["File", "文件", "檔案", "ファイル"],
        Msg::MenuHelp => ["Help", "帮助", "說明", "ヘルプ"],
        Msg::MenuOpenMain => [
            "Open Main Window",
            "打开主界面",
            "開啟主介面",
            "メイン画面を開く",
        ],
        Msg::MenuOpenInBrowser => [
            "Open Current Page in Browser",
            "在浏览器中打开当前页",
            "在瀏覽器中開啟目前頁面",
            "現在のページをブラウザで開く",
        ],
        Msg::TrayOpenMain => [
            "Open Main Window",
            "打开主界面",
            "開啟主介面",
            "メイン画面を開く",
        ],
        Msg::TrayOpenInBrowser => [
            "Open in Browser",
            "在浏览器中打开",
            "在瀏覽器中開啟",
            "ブラウザで開く",
        ],
        Msg::TrayQuit => ["Quit AAIGC", "退出 AAIGC", "結束 AAIGC", "AAIGC を終了"],
        Msg::WindowSettings => ["AAIGC Settings", "AAIGC 设置", "AAIGC 設定", "AAIGC の設定"],
        Msg::WindowAbout => ["About AAIGC", "关于 AAIGC", "關於 AAIGC", "AAIGC について"],
        Msg::DialogSaveDiagnostics => [
            "Save Diagnostics Report",
            "保存诊断报告",
            "儲存診斷報告",
            "診断レポートを保存",
        ],
        Msg::ErrUnknownPanel => [
            "Unknown panel: {view}",
            "未知面板：{view}",
            "未知面板：{view}",
            "不明なパネル：{view}",
        ],
        Msg::ErrConnectProbeFailed => [
            "The connectivity probe task failed: {error}",
            "连接探测任务异常：{error}",
            "連線探測工作異常：{error}",
            "接続確認タスクが異常終了しました：{error}",
        ],
        Msg::ErrInvalidLink => [
            "Invalid link: {error}",
            "非法链接：{error}",
            "非法連結：{error}",
            "不正なリンク：{error}",
        ],
        Msg::ErrSchemeNotAllowed => [
            "Only http / https / mailto / tel links are allowed, got: {scheme}",
            "只允许打开 http / https / mailto / tel 链接，收到：{scheme}",
            "只允許開啟 http / https / mailto / tel 連結，收到：{scheme}",
            "開けるのは http / https / mailto / tel リンクのみです。受信：{scheme}",
        ],
        Msg::ErrOpenExternalFailed => [
            "Failed to open with the system default app: {error}",
            "用系统默认应用打开失败：{error}",
            "用系統預設應用程式開啟失敗：{error}",
            "システムの既定アプリで開けませんでした：{error}",
        ],
        Msg::ErrInvalidSitePort => [
            "Invalid site port: {port}",
            "站点端口不合法：{port}",
            "站點連接埠不合法：{port}",
            "サイトのポートが不正です：{port}",
        ],
        Msg::ErrResolveSiteHost => [
            "Failed to resolve the site host {host}: {error}",
            "无法解析站点主机 {host}：{error}",
            "無法解析站點主機 {host}：{error}",
            "サイトのホスト {host} を解決できません：{error}",
        ],
        Msg::ErrConnectFailed => [
            "Can't connect to {host}:{port} ({error})",
            "无法连接 {host}:{port}（{error}）",
            "無法連線 {host}:{port}（{error}）",
            "{host}:{port} に接続できません（{error}）",
        ],
        Msg::ErrNoResolvedAddress => [
            "No usable address resolved for {host}:{port}",
            "{host}:{port} 没有解析出可用地址",
            "{host}:{port} 沒有解析出可用位址",
            "{host}:{port} の利用可能なアドレスを解決できませんでした",
        ],
        Msg::ErrResolveSavePath => [
            "Failed to resolve the save path: {error}",
            "无法解析保存路径：{error}",
            "無法解析儲存路徑：{error}",
            "保存先のパスを解決できません：{error}",
        ],
        Msg::ErrWriteFile => [
            "Failed to write {path}: {error}",
            "写入 {path} 失败：{error}",
            "寫入 {path} 失敗：{error}",
            "{path} への書き込みに失敗しました：{error}",
        ],
    }
}

/// 当前生效的语言。启动时是 `DEFAULT`，壳 UI 加载后由 `set_locale` 校正。
static ACTIVE: RwLock<&'static str> = RwLock::new(DEFAULT);

/// 把 BCP-47 标签收敛到支持的语言；命中不了就回落到产品默认语言。
///
/// 与壳 UI 的 `src/shell/i18n.ts` 的 `resolveLocale()` 保持同一套规则：
/// 繁体按地区 / 书写系统判定，其余 `zh*` 归简体。
pub fn normalize(tag: &str) -> &'static str {
    let normalized = tag.trim().to_lowercase().replace('_', "-");

    if normalized == "zh-tw"
        || normalized == "zh-hk"
        || normalized == "zh-mo"
        || normalized.starts_with("zh-hant")
    {
        return "zh-TW";
    }

    if normalized == "zh" || normalized.starts_with("zh-") {
        return "zh-CN";
    }

    if normalized == "ja" || normalized.starts_with("ja-") {
        return "ja";
    }

    if normalized == "en" || normalized.starts_with("en-") {
        return "en";
    }

    DEFAULT
}

fn active() -> &'static str {
    // 中毒说明别的线程持锁时 panic 了；语言值本身仍是完好的 `&'static str`，照读。
    *ACTIVE.read().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// 设置当前语言，返回收敛后的结果。
pub fn set_active(tag: &str) -> &'static str {
    let resolved = normalize(tag);
    *ACTIVE
        .write()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = resolved;
    resolved
}

fn locale_index(locale: &str) -> usize {
    SUPPORTED
        .iter()
        .position(|candidate| *candidate == locale)
        .or_else(|| SUPPORTED.iter().position(|candidate| *candidate == DEFAULT))
        .expect("SUPPORTED 必须包含 DEFAULT")
}

fn render(msg: Msg, args: &[(&str, &str)]) -> String {
    let template = translations(msg)[locale_index(active())];

    if args.is_empty() {
        return template.to_string();
    }

    let mut result = template.to_string();

    for &(name, value) in args {
        result = result.replace(&format!("{{{name}}}"), value);
    }

    result
}

/// 取一条无占位符的原生文案。
pub fn tr(msg: Msg) -> String {
    render(msg, &[])
}

/// 取一条带 `{name}` 占位符的原生文案。
pub fn tr_args(msg: Msg, args: &[(&str, &str)]) -> String {
    render(msg, args)
}

/// 壳 UI 加载后把系统语言同步过来，原生侧据此重建菜单 / 托盘并改写面板窗口标题。
///
/// 启动时 `setup()` 只能先按 `DEFAULT` 建一套菜单（那时页面还没跑起来），
/// 这里再按系统语言校正一次。窗口标题只改已经存在的面板窗口；主窗口的标题
/// 来自 `tauri.conf.json`（产品名，不需要翻译）。
#[tauri::command]
pub fn set_locale(app: AppHandle, locale: String) -> Result<(), String> {
    set_active(&locale);

    crate::menu::refresh(&app).map_err(|error| error.to_string())?;
    crate::tray::refresh(&app).map_err(|error| error.to_string())?;

    for (label, msg) in [
        (crate::windows::SETTINGS, Msg::WindowSettings),
        (crate::windows::ABOUT, Msg::WindowAbout),
    ] {
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.set_title(&tr(msg));
        }
    }

    Ok(())
}
