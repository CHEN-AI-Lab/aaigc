// ─────────────────────────────────────────────────────────────────────────────
// CLI 专有界面文案（help / 设备码提示 / 表格表头 …）
//
// 为什么不在 shared/messages：那 4 个 JSON 由 shared 维护方持有，
// scripts/check-translations.py 会强制四语 key 完全对齐，改动需要同步走他们。
// 本文件是**过渡态**：领域文案（errors.* / tools.*）一律仍从 shared 取，
// 这里只放 shared 里确实不存在的 CLI 外壳文案。
// 交付报告里已列出建议下沉为 shared/messages `cli.*` 的 key 清单。
// ─────────────────────────────────────────────────────────────────────────────

import type { Locale } from 'shared/types'

type Localized = Record<Locale, string>

export const CLI_STRINGS = {
  appTitle: {
    en: 'AAIGC command line client',
    'zh-CN': 'AAIGC 命令行客户端',
    'zh-TW': 'AAIGC 命令列客戶端',
    ja: 'AAIGC コマンドラインクライアント',
  },
  usageLine: {
    en: 'Usage: aaigc <command> [options]',
    'zh-CN': '用法：aaigc <命令> [选项]',
    'zh-TW': '用法：aaigc <指令> [選項]',
    ja: '使い方: aaigc <コマンド> [オプション]',
  },
  sectionCommands: {
    en: 'Commands',
    'zh-CN': '命令',
    'zh-TW': '指令',
    ja: 'コマンド',
  },
  sectionOptions: {
    en: 'Global options',
    'zh-CN': '全局选项',
    'zh-TW': '全域選項',
    ja: 'グローバルオプション',
  },
  sectionEnv: {
    en: 'Environment',
    'zh-CN': '环境变量',
    'zh-TW': '環境變數',
    ja: '環境変数',
  },
  sectionExamples: {
    en: 'Examples',
    'zh-CN': '示例',
    'zh-TW': '範例',
    ja: '例',
  },
  sectionExitCodes: {
    en: 'Exit codes',
    'zh-CN': '退出码',
    'zh-TW': '結束碼',
    ja: '終了コード',
  },
  cmdLogin: {
    en: 'Sign in with the device flow',
    'zh-CN': '使用设备码流程登录',
    'zh-TW': '使用裝置碼流程登入',
    ja: 'デバイスフローでサインイン',
  },
  cmdLogout: {
    en: 'Revoke the session and clear local credentials',
    'zh-CN': '登出并清除本地凭证',
    'zh-TW': '登出並清除本機憑證',
    ja: 'サインアウトしてローカル資格情報を削除',
  },
  cmdToolsList: {
    en: 'List available tools',
    'zh-CN': '列出可用工具',
    'zh-TW': '列出可用工具',
    ja: '利用可能なツール一覧',
  },
  cmdToolsRun: {
    en: 'Run a tool and print its result',
    'zh-CN': '执行工具并输出结果',
    'zh-TW': '執行工具並輸出結果',
    ja: 'ツールを実行して結果を出力',
  },
  cmdFavoritesList: {
    en: 'List favorites synced from the server',
    'zh-CN': '列出已同步的收藏',
    'zh-TW': '列出已同步的收藏',
    ja: '同期済みのお気に入り一覧',
  },
  cmdFavoritesAdd: {
    en: 'Add a favorite',
    'zh-CN': '添加收藏',
    'zh-TW': '新增收藏',
    ja: 'お気に入りを追加',
  },
  cmdFavoritesRemove: {
    en: 'Remove a favorite',
    'zh-CN': '移除收藏',
    'zh-TW': '移除收藏',
    ja: 'お気に入りを削除',
  },
  cmdHelp: {
    en: 'Show this help',
    'zh-CN': '显示帮助',
    'zh-TW': '顯示說明',
    ja: 'ヘルプを表示',
  },
  optJson: {
    en: 'Print machine-readable JSON on stdout only',
    'zh-CN': '仅在 stdout 输出机器可解析的 JSON',
    'zh-TW': '僅在 stdout 輸出機器可解析的 JSON',
    ja: 'stdout に機械可読な JSON のみを出力',
  },
  optLang: {
    en: 'Output language: {locales}',
    'zh-CN': '输出语言：{locales}',
    'zh-TW': '輸出語言：{locales}',
    ja: '出力言語: {locales}',
  },
  optNoColor: {
    en: 'Disable ANSI colors',
    'zh-CN': '关闭 ANSI 颜色',
    'zh-TW': '關閉 ANSI 顏色',
    ja: 'ANSI カラーを無効化',
  },
  optColor: {
    en: 'Force ANSI colors (overrides NO_COLOR)',
    'zh-CN': '强制输出 ANSI 颜色（覆盖 NO_COLOR）',
    'zh-TW': '強制輸出 ANSI 顏色（覆寫 NO_COLOR）',
    ja: 'ANSI カラーを強制（NO_COLOR を上書き）',
  },
  optApiBaseUrl: {
    en: 'API base URL (defaults to the {env} environment variable)',
    'zh-CN': 'API 基址（默认取环境变量 {env}）',
    'zh-TW': 'API 基底網址（預設取環境變數 {env}）',
    ja: 'API ベース URL（既定: 環境変数 {env}）',
  },
  optConfigDir: {
    en: 'Config directory (defaults to the {env} environment variable)',
    'zh-CN': '配置目录（默认取环境变量 {env}）',
    'zh-TW': '設定目錄（預設取環境變數 {env}）',
    ja: '設定ディレクトリ（既定: 環境変数 {env}）',
  },
  optHelp: {
    en: 'Show help',
    'zh-CN': '显示帮助',
    'zh-TW': '顯示說明',
    ja: 'ヘルプを表示',
  },
  optVersion: {
    en: 'Show version',
    'zh-CN': '显示版本',
    'zh-TW': '顯示版本',
    ja: 'バージョンを表示',
  },
  optInput: {
    en: "Tool input as a JSON object, or '-' to read stdin",
    'zh-CN': '工具入参 JSON 对象，"-" 表示从 stdin 读取',
    'zh-TW': '工具入參 JSON 物件，"-" 表示從 stdin 讀取',
    ja: 'ツール入力の JSON オブジェクト、"-" で標準入力から読み込み',
  },
  optTier: {
    en: 'Filter by tier: {tiers}',
    'zh-CN': '按层级过滤：{tiers}',
    'zh-TW': '依層級過濾：{tiers}',
    ja: 'ティアで絞り込み: {tiers}',
  },
  optCapability: {
    en: 'Filter by capability (repeatable): {capabilities}',
    'zh-CN': '按能力过滤（可重复）：{capabilities}',
    'zh-TW': '依能力過濾（可重複）：{capabilities}',
    ja: 'ケイパビリティで絞り込み（複数指定可）: {capabilities}',
  },
  optSince: {
    en: 'Only return favorites changed after this ISO 8601 timestamp',
    'zh-CN': '仅返回该 ISO 8601 时间之后变更的收藏',
    'zh-TW': '僅回傳該 ISO 8601 時間之後變更的收藏',
    ja: '指定した ISO 8601 時刻以降に変更されたお気に入りのみ返す',
  },
  optType: {
    en: 'Favorite type (default: tool)',
    'zh-CN': '收藏类型（默认 tool）',
    'zh-TW': '收藏類型（預設 tool）',
    ja: 'お気に入りの種類（既定: tool）',
  },
  envApiBaseUrl: {
    en: 'origin serving the AAIGC API — required by every command that talks to the server',
    'zh-CN': '提供 AAIGC API 的站点 origin —— 所有需要联网的命令都依赖它',
    'zh-TW': '提供 AAIGC API 的站點 origin —— 所有需要連網的指令都依賴它',
    ja: 'AAIGC API を提供するオリジン — サーバーと通信する全コマンドで必須',
  },
  envConfigDir: {
    en: 'directory holding credentials (created with mode 0700, files 0600)',
    'zh-CN': '存放凭证的目录（目录权限 0700，文件 0600）',
    'zh-TW': '存放憑證的目錄（目錄權限 0700，檔案 0600）',
    ja: '資格情報を置くディレクトリ（ディレクトリ 0700 / ファイル 0600）',
  },
  envLang: {
    en: 'output language, same values as --lang',
    'zh-CN': '输出语言，取值同 --lang',
    'zh-TW': '輸出語言，取值同 --lang',
    ja: '出力言語。--lang と同じ値',
  },
  envTelemetry: {
    en: 'set to 1/true to opt in to anonymous usage reporting (off by default)',
    'zh-CN': '设为 1/true 才开启匿名使用上报（默认关闭）',
    'zh-TW': '設為 1/true 才開啟匿名使用回報（預設關閉）',
    ja: '1/true で匿名利用状況の送信を有効化（既定は無効）',
  },
  exampleLogin: {
    en: 'aaigc login',
    'zh-CN': 'aaigc login',
    'zh-TW': 'aaigc login',
    ja: 'aaigc login',
  },
  exampleToolsRun: {
    en: "aaigc tools run text-to-slug --input '{\"text\":\"Hello World\"}'",
    'zh-CN': "aaigc tools run text-to-slug --input '{\"text\":\"Hello World\"}'",
    'zh-TW': "aaigc tools run text-to-slug --input '{\"text\":\"Hello World\"}'",
    ja: "aaigc tools run text-to-slug --input '{\"text\":\"Hello World\"}'",
  },
  examplePipe: {
    en: 'cat input.json | aaigc tools run json-formatter --input - --json',
    'zh-CN': 'cat input.json | aaigc tools run json-formatter --input - --json',
    'zh-TW': 'cat input.json | aaigc tools run json-formatter --input - --json',
    ja: 'cat input.json | aaigc tools run json-formatter --input - --json',
  },
  exitCodeOk: {
    en: 'success',
    'zh-CN': '成功',
    'zh-TW': '成功',
    ja: '成功',
  },
  exitCodeFailure: {
    en: 'business failure (API error, tool failure, not signed in)',
    'zh-CN': '业务失败（API 报错、工具失败、未登录）',
    'zh-TW': '業務失敗（API 錯誤、工具失敗、未登入）',
    ja: '業務エラー（API エラー、ツール失敗、未サインイン）',
  },
  exitCodeUsage: {
    en: 'usage or configuration error',
    'zh-CN': '用法或配置错误',
    'zh-TW': '用法或設定錯誤',
    ja: '使い方または設定のエラー',
  },
  loginRequesting: {
    en: 'Requesting a device code…',
    'zh-CN': '正在申请设备码…',
    'zh-TW': '正在申請裝置碼…',
    ja: 'デバイスコードを要求しています…',
  },
  loginOpenUrl: {
    en: 'Open this URL in your browser and enter the user code:',
    'zh-CN': '请在浏览器打开以下地址并输入用户码：',
    'zh-TW': '請在瀏覽器開啟以下網址並輸入使用者代碼：',
    ja: 'ブラウザで次の URL を開き、ユーザーコードを入力してください:',
  },
  loginUserCodeLabel: {
    en: 'User code',
    'zh-CN': '用户码',
    'zh-TW': '使用者代碼',
    ja: 'ユーザーコード',
  },
  loginNoVerificationUri: {
    en: 'The server did not return a verification URL (NEXT_PUBLIC_APP_URL is not configured). Enter the user code on the site that issued this device code.',
    'zh-CN': '服务端未返回验证地址（NEXT_PUBLIC_APP_URL 未配置）。请在本设备码的签发站点上输入用户码。',
    'zh-TW': '伺服器未回傳驗證網址（NEXT_PUBLIC_APP_URL 未設定）。請在本裝置碼的簽發站點輸入使用者代碼。',
    ja: 'サーバーが検証 URL を返しませんでした（NEXT_PUBLIC_APP_URL が未設定）。このコードを発行したサイトでユーザーコードを入力してください。',
  },
  loginWaiting: {
    en: 'Waiting for approval… (Ctrl+C to cancel)',
    'zh-CN': '等待授权中…（Ctrl+C 取消）',
    'zh-TW': '等待授權中…（Ctrl+C 取消）',
    ja: '承認待ち…（Ctrl+C で中止）',
  },
  loginApproved: {
    en: 'Signed in as {name}',
    'zh-CN': '已登录：{name}',
    'zh-TW': '已登入：{name}',
    ja: 'サインインしました: {name}',
  },
  loginRetryHint: {
    en: 'Run `aaigc login` again to retry.',
    'zh-CN': '请重新执行 `aaigc login`。',
    'zh-TW': '請重新執行 `aaigc login`。',
    ja: '再度 `aaigc login` を実行してください。',
  },
  hintLoginRequired: {
    en: 'Run `aaigc login` to sign in.',
    'zh-CN': '请执行 `aaigc login` 登录。',
    'zh-TW': '請執行 `aaigc login` 登入。',
    ja: '`aaigc login` でサインインしてください。',
  },
  logoutDone: {
    en: 'Signed out.',
    'zh-CN': '已登出。',
    'zh-TW': '已登出。',
    ja: 'サインアウトしました。',
  },
  logoutNotSignedIn: {
    en: 'No local credentials found; nothing to do.',
    'zh-CN': '本地没有凭证，无需处理。',
    'zh-TW': '本機沒有憑證，無需處理。',
    ja: 'ローカルに資格情報がありません。',
  },
  logoutRevokeFailed: {
    en: 'Local credentials cleared, but the server-side revoke call failed.',
    'zh-CN': '本地凭证已清除，但服务端撤销调用失败。',
    'zh-TW': '本機憑證已清除，但伺服器撤銷呼叫失敗。',
    ja: 'ローカルの資格情報は削除しましたが、サーバー側の失効に失敗しました。',
  },
  sessionExpired: {
    en: 'Session expired. Run `aaigc login` again.',
    'zh-CN': '会话已过期，请重新执行 `aaigc login`。',
    'zh-TW': '工作階段已過期，請重新執行 `aaigc login`。',
    ja: 'セッションが期限切れです。再度 `aaigc login` を実行してください。',
  },
  tokenRefreshed: {
    en: 'Access token refreshed.',
    'zh-CN': '访问令牌已续期。',
    'zh-TW': '存取權杖已續期。',
    ja: 'アクセストークンを更新しました。',
  },
  toolsEmpty: {
    en: 'No tools matched the filter.',
    'zh-CN': '没有匹配的工具。',
    'zh-TW': '沒有符合的工具。',
    ja: '条件に一致するツールがありません。',
  },
  toolsColId: { en: 'ID', 'zh-CN': 'ID', 'zh-TW': 'ID', ja: 'ID' },
  toolsColTier: { en: 'Tier', 'zh-CN': '层级', 'zh-TW': '層級', ja: 'ティア' },
  toolsColCaps: {
    en: 'Capabilities',
    'zh-CN': '能力',
    'zh-TW': '能力',
    ja: 'ケイパビリティ',
  },
  toolsColName: { en: 'Name', 'zh-CN': '名称', 'zh-TW': '名稱', ja: '名前' },
  toolsReadingStdin: {
    en: 'Reading tool input from stdin…',
    'zh-CN': '正在从 stdin 读取工具入参…',
    'zh-TW': '正在從 stdin 讀取工具入參…',
    ja: '標準入力からツール入力を読み込み中…',
  },
  favoritesEmpty: {
    en: 'No favorites yet.',
    'zh-CN': '暂无收藏。',
    'zh-TW': '尚無收藏。',
    ja: 'お気に入りはまだありません。',
  },
  favoritesColTool: { en: 'Tool', 'zh-CN': '工具', 'zh-TW': '工具', ja: 'ツール' },
  favoritesColType: { en: 'Type', 'zh-CN': '类型', 'zh-TW': '類型', ja: '種類' },
  favoritesColCreated: {
    en: 'Added at',
    'zh-CN': '添加时间',
    'zh-TW': '新增時間',
    ja: '追加日時',
  },
  favoritesAdded: {
    en: 'Added to favorites: {toolId}',
    'zh-CN': '已添加收藏：{toolId}',
    'zh-TW': '已新增收藏：{toolId}',
    ja: 'お気に入りに追加しました: {toolId}',
  },
  favoritesRemoved: {
    en: 'Removed from favorites: {toolId}',
    'zh-CN': '已移除收藏：{toolId}',
    'zh-TW': '已移除收藏：{toolId}',
    ja: 'お気に入りから削除しました: {toolId}',
  },
  errCliUsage: {
    en: 'Invalid usage.',
    'zh-CN': '用法错误。',
    'zh-TW': '用法錯誤。',
    ja: '使い方が正しくありません。',
  },
  errCliConfigMissing: {
    en: 'Required configuration is missing.',
    'zh-CN': '缺少必需配置。',
    'zh-TW': '缺少必要設定。',
    ja: '必須の設定がありません。',
  },
  hintApiBaseUrl: {
    en: 'Set {env} (or pass --api-base-url) to the origin that serves the AAIGC API.',
    'zh-CN': '请把 {env}（或 --api-base-url）设为提供 AAIGC API 的站点 origin。',
    'zh-TW': '請將 {env}（或 --api-base-url）設為提供 AAIGC API 的站點 origin。',
    ja: 'AAIGC API を提供するオリジンに {env}（または --api-base-url）を設定してください。',
  },
  hintLang: {
    en: 'Supported languages: {locales}',
    'zh-CN': '支持的语言：{locales}',
    'zh-TW': '支援的語言：{locales}',
    ja: '対応言語: {locales}',
  },
  errInputRequired: {
    en: 'Provide tool input with --input <json>, or pipe it through stdin.',
    'zh-CN': '请用 --input <json> 提供入参，或通过 stdin 管道传入。',
    'zh-TW': '請用 --input <json> 提供入參，或透過 stdin 管線傳入。',
    ja: '--input <json> で入力を渡すか、標準入力からパイプしてください。',
  },
  errInputNotObject: {
    en: 'Tool input must be a JSON object, e.g. \'{"text":"hello"}\'.',
    'zh-CN': '工具入参必须是 JSON 对象，例如 \'{"text":"hello"}\'。',
    'zh-TW': '工具入參必須是 JSON 物件，例如 \'{"text":"hello"}\'。',
    ja: 'ツール入力は JSON オブジェクトである必要があります（例: \'{"text":"hello"}\'）。',
  },
  warnPrefix: { en: 'warning:', 'zh-CN': '警告：', 'zh-TW': '警告：', ja: '警告:' },
  errorPrefix: { en: 'error:', 'zh-CN': '错误：', 'zh-TW': '錯誤：', ja: 'エラー:' },
} satisfies Record<string, Localized>

export type CliStringKey = keyof typeof CLI_STRINGS
