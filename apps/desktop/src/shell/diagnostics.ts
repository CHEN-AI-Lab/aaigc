import { getVersion } from '@tauri-apps/api/app'

import { errorText } from './error-text'
import { getSiteOrigin, probeSite } from './native'

/**
 * 拼一份给用户导出的诊断报告。
 *
 * 只收集排查「连不上」需要的信息，不含任何账号 / 凭据内容。
 */
export async function buildDiagnostics(): Promise<string> {
  const lines = [
    '# AAIGC 桌面端诊断报告',
    `生成时间：${new Date().toISOString()}`,
    `外壳版本：${await describe(getVersion)}`,
    `站点地址（界面侧注入）：${__SITE_ORIGIN__}`,
    `站点地址（外壳侧注入）：${await describe(getSiteOrigin)}`,
    `站点连通性探测：${await describe(probeAndReport)}`,
    `运行环境：${navigator.userAgent}`,
  ]

  return `${lines.join('\n')}\n`
}

async function probeAndReport(): Promise<string> {
  await probeSite()
  return '可达'
}

async function describe(probe: () => Promise<string>): Promise<string> {
  try {
    return await probe()
  } catch (error) {
    return `不可用（${errorText(error)}）`
  }
}
