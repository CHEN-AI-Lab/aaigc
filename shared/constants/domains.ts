// ─────────────────────────────────────────────────────────────────────────────
// 本站域名 —— 唯一真源（用户已确认公开站域名）
//
// 这个文件是**唯一**允许出现本站域名字面量的地方。
// 其它任何文件（route / 组件 / 常量）都必须从这里取，禁止再写死域名。
//
// 与 SK-8 的关系：
//   SK-8 禁止的是「第三方端点 / 未确认域名」的硬编码与非空 fallback。
//   本站域名已由用户确认，属于**第一方已确认常量**，因此允许作为默认值存在；
//   部署环境仍可通过 NEXT_PUBLIC_APP_URL 覆盖（Preview / 生产各自注入）。
// ─────────────────────────────────────────────────────────────────────────────

function readEnv(name: string): string {
  return typeof process !== 'undefined' && process.env ? (process.env[name] ?? '') : ''
}

/** 逗号分隔 → 去空白 → 过滤空串 */
function parseList(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

/** 公开站域名（用户确认，第一方常量） */
export const PUBLIC_SITE_DOMAIN = 'aaigc.online'

/** 公开站 origin */
export const PUBLIC_SITE_ORIGIN = `https://${PUBLIC_SITE_DOMAIN}`

/** 统计面板 origin（生产 / 预览），Header 的「统计」入口使用 */
export const STATS_SITE_ORIGIN = `https://stats.${PUBLIC_SITE_DOMAIN}`
export const STATS_PREVIEW_SITE_ORIGIN = `https://stats-pre.${PUBLIC_SITE_DOMAIN}`

/** 对外联系邮箱 —— 域名部分取自上面的常量，不再单独硬编码 */
export const CONTACT_EMAIL = `AAIGC@${PUBLIC_SITE_DOMAIN}`

/**
 * 站点基址（末尾无斜杠），供 sitemap / robots / metadata / device flow 使用。
 *
 * `NEXT_PUBLIC_APP_URL` 优先（Preview / 生产各自注入）；
 * 未配置时回落到**已确认的公开站 origin**（第一方常量，不是第三方 fallback）。
 */
export function siteOrigin(): string {
  const raw = readEnv('NEXT_PUBLIC_APP_URL').trim().replace(/\/+$/, '')
  return raw.length > 0 ? raw : PUBLIC_SITE_ORIGIN
}

/**
 * `NEXT_PUBLIC_APP_URL` 是否被**显式配置**。
 *
 * 与 `siteOrigin()` 的分工：
 *   · `siteOrigin()` —— 未配置时回落到已确认的公开站 origin，用于「给个可用地址」的场景
 *     （sitemap / metadata / device flow）。
 *   · `isSiteOriginConfigured()` —— 只回答「配没配」，用于**未配置本身就是承重的语义**的场景：
 *     · `robots.ts`：未配置 → disallow 全部，避免 Preview / 未配置环境被搜索引擎收录；
 *     · `deviceVerificationUri()`：未配置 → 返回空串，客户端提示「服务未配置」，
 *       而不是把用户引导到一个设备码并不存在的站点（SK-8：无非空 fallback）。
 *
 * 这类判定**不能**用 `siteOrigin()` 替代——它永远非空，会把「未配置」这个状态吃掉。
 */
export function isSiteOriginConfigured(): boolean {
  return readEnv('NEXT_PUBLIC_APP_URL').trim().length > 0
}

/**
 * CORS 允许的 Origin 白名单（逗号分隔）。
 * 环境变量：API_CORS_ORIGINS；**空值 = 空数组**（不下发 ACAO，禁止非空 fallback）。
 *
 * 注意：这里只包含「显式配置」的 origin。需要连同本站 origin 一起使用时
 * 请用 `apiCorsOrigins()`，避免两处各写一套合并逻辑。
 */
export function corsOrigins(): string[] {
  return parseList(readEnv('API_CORS_ORIGINS'))
}

/**
 * API 实际使用的 CORS 白名单 = 显式配置 ∪ 本站 origin。
 *
 * 含本站 origin 的原因：桌面端 WebView / 自定义域场景会带上本站 origin，
 * 而同站请求下发 ACAO 是无害的。未做任何第三方非空 fallback。
 */
export function apiCorsOrigins(): string[] {
  const configured = corsOrigins()
  const own = siteOrigin()
  return configured.includes(own) ? configured : [...configured, own]
}
