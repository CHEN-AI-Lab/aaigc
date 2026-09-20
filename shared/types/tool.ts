// ─────────────────────────────────────────────────────────────────────────────
// Tool contract types — 五端（web / weapp / app / desktop / cli）唯一真源
// 参考：架构设计 §4.1「工具逻辑下沉：统一函数签名」
// ─────────────────────────────────────────────────────────────────────────────

/** 38 个工具的稳定 ID（与 data/tools.ts 的 ToolMeta.id 一一对应） */
export const TOOL_IDS = [
  'json-formatter',
  'base64',
  'url-encode',
  'regex-tester',
  'jwt-decoder',
  'uuid-generator',
  'html-preview',
  'html-entities',
  'css-minifier',
  'number-base',
  'yaml-json',
  'json-to-csv',
  'word-counter',
  'markdown-preview',
  'case-converter',
  'text-diff',
  'lorem-ipsum',
  'text-to-slug',
  'list-sorter',
  'password-generator',
  'qrcode',
  'color-picker',
  'image-to-base64',
  'image-converter',
  'image-editor',
  'calculator',
  'ip-lookup',
  'dns-lookup',
  'http-status-codes',
  'user-agent-parser',
  'timestamp',
  'date-calculator',
  'timer',
  'emoji-picker',
  'random-generator',
  'cron-builder',
  'pdf-tool',
  'file-renamer',
] as const

export type ToolId = (typeof TOOL_IDS)[number]

/** T1 纯计算（可离线、可 CLI/小程序全量复用）；T2 需平台能力；T3 依赖网络 */
export type ToolTier = 'T1' | 'T2' | 'T3'

/** 工具运行所需的平台能力。端侧据此决定「原生实现 / WebView 兜底」 */
export type ToolCapability =
  | 'dom'
  | 'canvas'
  | 'file'
  | 'network'
  | 'clipboard'
  | 'timer'

/**
 * 平台能力注入点 —— 保证纯逻辑可测、五端结果一致。
 * 时间与随机性必须经此注入，否则 uuid / password / random / lorem / timestamp /
 * date-calculator 六个工具不可测试且跨端结果不一致。
 */
export interface ToolContext {
  /** BCP-47 locale，供排序/日期格式化，不做文案分支 */
  locale: string
  /** IANA 时区，如 'Asia/Shanghai' */
  timezone: string
  /** 注入时间源（毫秒 epoch） */
  now(): number
  /** 注入随机源 */
  randomBytes(length: number): Uint8Array
  signal?: AbortSignal
  /** 仅 T3 提供；T1/T2 不得使用（由 purity 测试强制） */
  fetchJson?<T>(url: string, init?: ToolFetchInit): Promise<T>
}

export interface ToolFetchInit {
  method?: string
  headers?: Record<string, string>
  body?: string
}

/** 工具错误的稳定枚举值（来自 shared/constants/error-codes.ts 的 TOOL_ERROR_CODES） */
export type ToolErrorCode =
  | 'invalidInput'
  | 'invalidJson'
  | 'invalidBase64'
  | 'invalidUrl'
  | 'invalidJwt'
  | 'invalidRegex'
  | 'invalidNumber'
  | 'invalidDate'
  | 'invalidTimestamp'
  | 'invalidHex'
  | 'invalidExpression'
  | 'outOfRange'
  | 'emptyInput'
  | 'unsupportedPlatform'
  | 'networkFailed'

export interface ToolError {
  /** 稳定枚举 */
  code: ToolErrorCode
  /** shared/messages 的 i18n key；端侧按自己 locale 渲染，函数内不含任何语言文案 */
  messageKey: string
  params?: Record<string, string | number>
  /**
   * 引擎原始报错（如 JSON.parse / new RegExp 抛出的 message）。
   * 仅作次要文案展示，端侧应先渲染 t(messageKey)，再附挂 detail。
   * 不含语言逻辑，端侧可自由决定是否展示。
   */
  detail?: string
}

/** 判别联合：跨端（尤其小程序/CLI）异常栈不可靠，故不 throw 业务错误 */
export type ToolOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error: ToolError }

/** 声明式输入字段 —— 驱动五端自动生成表单 / CLI 参数 */
export interface ToolInputField {
  name: string
  kind: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'file' | 'color'
  required: boolean
  /** i18n key（tools.* namespace） */
  labelKey: string
  placeholderKey?: string
  options?: { value: string; labelKey: string }[]
  default?: string | number | boolean
}

export interface ToolDefinition<I = unknown, O = unknown> {
  id: ToolId
  tier: ToolTier
  capabilities: ToolCapability[]
  inputs: ToolInputField[]
  /** 原始输入 → 领域输入（校验 + 归一化；不做 IO） */
  parse(raw: Record<string, unknown>, ctx: ToolContext): ToolOutcome<I>
  /** 纯计算主体；T3 可返回 Promise */
  run(input: I, ctx: ToolContext): ToolOutcome<O> | Promise<ToolOutcome<O>>
  /** 文本渲染（CLI stdout / 小程序纯文本兜底 / golden 测试基线） */
  render(out: O, ctx: ToolContext): string
}
