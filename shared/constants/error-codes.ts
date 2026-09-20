// ─────────────────────────────────────────────────────────────────────────────
// 唯一错误码真源（SK-2：错误码 = i18n key）
//
// 强约束：
//   1. 响应体形状保持 `{ error: <ApiErrorCode>, errorParams? }` —— Web 端
//      `t(data.error)` / `err(data.error)` 直接把该字符串当 i18n key 消费，
//      改动形状会导致 Web 全线崩。
//   2. 本文件的每个取值必须在 4 个 shared/messages/*.json 的 `errors.*` 下存在，
//      由 scripts/check-translations.py 强制。
// ─────────────────────────────────────────────────────────────────────────────

/** 既有错误码（保持原字符串，零 Web 破坏性变更） */
export const LEGACY_API_ERROR_CODES = [
  'notFound',
  'notFoundDesc',
  'backHome',
  'verifyFailed',
  'sendFailed',
  'passwordTooShort',
  'registerFailed',
  'accountLocked',
  'attemptsRemaining',
  'codeRecentlySent',
  'rateLimited',
  'invalidEmail',
  'realEmail',
  'emailNotRegistered',
  'emailRegistered',
  'agreeTermsRequired',
  'loginRequired',
  'forbidden',
  'tooManyRequests',
  'invalidJson',
  'missingToolId',
  'invalidType',
  'invalidProvider',
  'cannotUnlinkEmail',
  'notSet',
  'mustKeepOneMethod',
  'missingDomain',
  'invalidDnsType',
  'domainTooLong',
  'invalidDomain',
  'dnsNoRecords',
  'currentPasswordWrong',
  'invalidParams',
  'ipLookupFailed',
  'invalidName',
  'nameTooLong',
  'invalidPhone',
  'userNotFound',
  'phoneAlreadyBound',
  'setPasswordFirst',
  'phoneBound',
  'bindFailed',
  'requestFailed',
  'verifyError',
  'tooManyAttempts',
  'nameRequired',
  'verifyEmailFirst',
  'passwordNeedsTypes',
  'passwordCommon',
  'passwordTooLong',
] as const

/** 多端新增错误码（阶段 1 随 Bearer 通道 / 收藏同步引入） */
export const MULTI_CLIENT_API_ERROR_CODES = [
  'tokenInvalid',
  'tokenExpired',
  'refreshTokenInvalid',
  'grantTypeUnsupported',
  'authorizationPending',
  'deviceCodeExpired',
  'deviceCodeNotFound',
  'deviceCodeConsumed',
  'weappLoginFailed',
  'syncPayloadInvalid',
  'toolNotFound',
  'toolUnsupportedOnPlatform',
  'invalidCredentials',
  'missingClientId',
  'invalidClientId',
  'missingRefreshToken',
  'missingDeviceCode',
  'missingUserCode',
  'emailRequired',
  'codeRequired',
  'passwordRequired',
  'networkFailed',
] as const

export const API_ERROR_CODES = [
  ...LEGACY_API_ERROR_CODES,
  ...MULTI_CLIENT_API_ERROR_CODES,
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

/** code → HTTP 状态。SK-1：失败响应的状态码一律由此表决定 */
export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  // ── 既有 ──
  notFound: 404,
  notFoundDesc: 404,
  backHome: 404,
  verifyFailed: 400,
  sendFailed: 500,
  passwordTooShort: 400,
  registerFailed: 400,
  accountLocked: 429,
  attemptsRemaining: 429,
  codeRecentlySent: 429,
  rateLimited: 429,
  invalidEmail: 400,
  realEmail: 400,
  emailNotRegistered: 400,
  emailRegistered: 409,
  agreeTermsRequired: 400,
  loginRequired: 401,
  forbidden: 403,
  tooManyRequests: 429,
  invalidJson: 400,
  missingToolId: 400,
  invalidType: 400,
  invalidProvider: 400,
  cannotUnlinkEmail: 400,
  notSet: 400,
  mustKeepOneMethod: 400,
  missingDomain: 400,
  invalidDnsType: 400,
  domainTooLong: 400,
  invalidDomain: 400,
  dnsNoRecords: 404,
  currentPasswordWrong: 400,
  invalidParams: 400,
  ipLookupFailed: 500,
  invalidName: 400,
  nameTooLong: 400,
  invalidPhone: 400,
  userNotFound: 404,
  phoneAlreadyBound: 409,
  setPasswordFirst: 400,
  phoneBound: 409,
  bindFailed: 500,
  requestFailed: 500,
  verifyError: 400,
  tooManyAttempts: 429,
  nameRequired: 400,
  verifyEmailFirst: 403,
  passwordNeedsTypes: 400,
  passwordCommon: 400,
  passwordTooLong: 400,
  // ── 多端新增 ──
  tokenInvalid: 401,
  tokenExpired: 401,
  refreshTokenInvalid: 401,
  grantTypeUnsupported: 400,
  authorizationPending: 409,
  deviceCodeExpired: 410,
  deviceCodeNotFound: 404,
  deviceCodeConsumed: 409,
  weappLoginFailed: 401,
  syncPayloadInvalid: 400,
  toolNotFound: 404,
  toolUnsupportedOnPlatform: 501,
  invalidCredentials: 401,
  missingClientId: 400,
  invalidClientId: 400,
  missingRefreshToken: 400,
  missingDeviceCode: 400,
  missingUserCode: 400,
  emailRequired: 400,
  codeRequired: 400,
  passwordRequired: 400,
  networkFailed: 503,
}

export function isApiErrorCode(value: string): value is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(value)
}

/** 构造失败响应体（形状固定，error 值即 i18n key） */
export function apiErrorBody(
  code: ApiErrorCode,
  errorParams?: Record<string, string | number>,
): { error: ApiErrorCode; errorParams?: Record<string, string | number> } {
  return errorParams ? { error: code, errorParams } : { error: code }
}

export function statusForErrorCode(code: ApiErrorCode): number {
  return API_ERROR_STATUS[code]
}

// ─────────────────────────────────────────────────────────────────────────────
// 工具层错误码（ToolOutcome.error.code）—— 与 API 错误码分离，
// 工具错误经 messageKey 本地化，不走 HTTP。
// ─────────────────────────────────────────────────────────────────────────────

export const TOOL_ERROR_CODES = [
  'invalidInput',
  'invalidJson',
  'invalidBase64',
  'invalidUrl',
  'invalidJwt',
  'invalidRegex',
  'invalidNumber',
  'invalidDate',
  'invalidTimestamp',
  'invalidHex',
  'invalidExpression',
  'outOfRange',
  'emptyInput',
  'unsupportedPlatform',
  'networkFailed',
] as const

export type ToolErrorCodeValue = (typeof TOOL_ERROR_CODES)[number]
