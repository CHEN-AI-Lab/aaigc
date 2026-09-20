// ─────────────────────────────────────────────────────────────────────────────
// 埋点开关 —— 默认关闭（Q10 / TELEMETRY_OFF_BY_DEFAULT_PLATFORMS 里包含 'cli'）
//
// 默认关 + 端点未配置即不发请求：shared/api/track.ts 在 WORKER_URL / FALLBACK_URL
// 都为空时直接返回 false，所以 CLI 不需要知道任何上报地址（SK-8 禁止硬编码）。
// 埋点失败永远不影响业务输出与退出码。
// ─────────────────────────────────────────────────────────────────────────────

import { track } from 'shared/api/track'
import { CLI_PLATFORM } from './config'

export interface ToolRunTelemetry {
  deviceId: string
  locale: string
  tool: string
}

export async function reportToolRun(options: ToolRunTelemetry): Promise<void> {
  try {
    await track({
      platform: CLI_PLATFORM,
      tool: options.tool,
      deviceId: options.deviceId,
      locale: options.locale,
      enabled: true,
    })
  } catch {
    // 埋点不得影响业务（track 自身已吞异常，这里再兜一层）
  }
}
