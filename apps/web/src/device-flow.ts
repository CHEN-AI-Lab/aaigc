// ─────────────────────────────────────────────────────────────────────────────
// device flow 的公共工具（架构 §4.2.1；CLI / 桌面端登录）
//
// 拆成独立模块而非放在 route.ts 里：Next.js 对 route 文件的导出有严格白名单
// （只允许 GET/POST/runtime/revalidate 等），多导出辅助函数会导致构建期类型报错。
// ─────────────────────────────────────────────────────────────────────────────

import { base64UrlEncode } from 'shared/utils/auth-token'
import { isSiteOriginConfigured, siteOrigin } from 'shared/constants/domains'

/** 设备码有效期 10 分钟 */
export const DEVICE_CODE_TTL_SECONDS = 10 * 60

/** 客户端轮询间隔（秒），与 DeviceCodeResponse.interval 一致 */
export const DEVICE_CODE_INTERVAL_SECONDS = 5

/** 去掉易混淆字符（0/O、1/I/L）的用户码字母表 */
const USER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const USER_CODE_LENGTH = 8

/** 密码学安全随机串（base64url） */
export function randomToken(bytes: number): string {
  const buffer = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(buffer)
  return base64UrlEncode(buffer)
}

/** 生成 8 位用户码（不含连字符，便于入库与比较） */
export function generateUserCode(): string {
  const buffer = new Uint8Array(USER_CODE_LENGTH)
  globalThis.crypto.getRandomValues(buffer)
  let out = ''
  for (const byte of buffer) out += USER_CODE_ALPHABET[byte % USER_CODE_ALPHABET.length]
  return out
}

/** 展示形态：XXXX-XXXX（人眼易读，用户手输） */
export function formatUserCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/** 归一化用户输入：大写 + 去掉所有非字母数字（用户可能输入连字符/空格/小写） */
export function normalizeUserCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * 用户在浏览器里完成授权的地址。
 *
 * 站点基址来自唯一真源 `siteOrigin()`（读 NEXT_PUBLIC_APP_URL，
 * 未配置回落已确认的公开站 origin；域名只写在 shared/constants/domains.ts）。
 *
 * 「未配置」单独用 `isSiteOriginConfigured()` 判定并**返回空串**：
 * 设备码存在当前这个环境的库里，未配置时若回落到公开站地址，
 * 会把用户引导到一个并不认识该 device_code 的站点（SK-8：非确认场景不留非空 fallback）。
 * 客户端收到空串应提示「服务未配置」，而不是拿一个可能是假的地址。
 *
 * TODO(T05) —— device 授权落地页（`/device`）落地时，下面两条必须一起做，别只做一半：
 *   1. **落地页必须部署在签发该 device_code 的同一环境**上。
 *      本机 dev server 签发的 device_code，公开站 `siteOrigin()` 根本不认识：
 *      拿 `siteOrigin()` 自动拼一个「看起来完整」的链接给用户点，
 *      用户只会得到一个必然失败、且看不懂的页面。
 *      这个坑踩过一次——宁可明确失败并把原因说清楚
 *      （见 `/api/auth/device/token` 的 missingDeviceCode / deviceCodeNotFound 分支），
 *      也不要给一个假入口。
 *   2. 落地页就绪后，重新评估「未配置 → 空串」这条策略：
 *      那时空串应等价于「当前环境不提供 device flow」，客户端依然只提示、不猜 URL。
 */
export function deviceVerificationUri(): string {
  if (!isSiteOriginConfigured()) return ''
  return `${siteOrigin()}/device`
}
