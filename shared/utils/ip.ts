// 可信客户端 IP 提取
// 限流键必须基于平台可信来源，否则攻击者可在 X-Forwarded-For 中
// 每次填入不同值，绕过所有基于该 header 的限流。

type WithIp = { ip?: string }
type LikeRequest = { headers: Headers } & Partial<WithIp>

/**
 * 返回可信的客户端 IP，用于限流键。
 * 优先级：
 *   1. NextRequest.ip（Vercel/Node 平台注入，客户端无法伪造）
 *   2. x-vercel-forwarded-for（Vercel 边缘覆写，可信）
 *   3. x-forwarded-for 的第一个段（兜底，相对原始整串更难绕过）
 *   4. x-real-ip
 */
export function getTrustedClientIp(req: LikeRequest): string {
  // 1. 平台注入的 ip（NextRequest 在 Vercel 上可用）
  const directIp = (req as WithIp).ip
  if (directIp && directIp.trim()) return directIp.trim()

  const xvf = req.headers.get('x-vercel-forwarded-for')
  if (xvf) {
    const seg = xvf.split(',')[0]?.trim()
    if (seg) return seg
  }

  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const seg = xff.split(',')[0]?.trim()
    if (seg) return seg
  }

  const realIp = req.headers.get('x-real-ip')
  if (realIp && realIp.trim()) return realIp.trim()

  return 'unknown'
}

/**
 * 判断 IPv4 地址是否属于私有/保留地址段。
 * 覆盖 RFC 1918、loopback、link-local（含云元数据 169.254.169.254）、
 * "this network"、carrier-grade NAT。
 */
function isPrivateIPv4(a: number, b: number, _c: number, _d: number): boolean {
  if (a === 127) return true                     // 127.0.0.0/8  loopback
  if (a === 10) return true                      // 10.0.0.0/8    private
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true          // 192.168.0.0/16 private
  if (a === 169 && b === 254) return true           // 169.254.0.0/16 link-local (含 169.254.169.254)
  if (a === 0) return true                        // 0.0.0.0/8     "this network"
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
  return false
}

/**
 * 判断 IP 地址（IPv4 或 IPv6）是否私有/保留。
 * 用于防止 SSRF：如果"客户端 IP"解析为内网地址，
 * 不应将其发送给外部 IP 查询服务（防止内网拓扑泄露）。
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase()

  // IPv6（含 IPv4-mapped IPv6）
  if (trimmed.includes(':')) {
    if (trimmed === '::1' || trimmed === '::') return true
    // IPv4-mapped IPv6 ::ffff:x.x.x.x
    const v4mapped = trimmed.match(/::ffff:(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (v4mapped) {
      return isPrivateIPv4(+v4mapped[1], +v4mapped[2], +v4mapped[3], +v4mapped[4])
    }
    // Unique local fc00::/7
    if (trimmed.startsWith('fc') || trimmed.startsWith('fd')) return true
    // Link-local fe80::/10
    if (/^fe[89ab]/.test(trimmed)) return true
    return false
  }

  // IPv4
  const parts = trimmed.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return false
  return isPrivateIPv4(parts[0], parts[1], parts[2], parts[3])
}
