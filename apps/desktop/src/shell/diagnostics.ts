import { getVersion } from '@tauri-apps/api/app'

import { errorText } from './error-text'
import { t } from './i18n'
import { getSiteOrigin, probeSite } from './native'

/**
 * 拼一份给用户导出的诊断报告。
 *
 * 只收集排查「连不上」需要的信息，不含任何账号 / 凭据内容。
 * 报告会落盘给用户看，所以整份文案走壳 UI 的 i18n。
 */
export async function buildDiagnostics(): Promise<string> {
  const lines = [
    t('desktop.diagnostics.report.title'),
    t('desktop.diagnostics.report.generatedAt', { value: new Date().toISOString() }),
    t('desktop.diagnostics.report.shellVersion', { value: await describe(getVersion) }),
    t('desktop.diagnostics.report.siteOriginUi', { value: __SITE_ORIGIN__ }),
    t('desktop.diagnostics.report.siteOriginShell', { value: await describe(getSiteOrigin) }),
    t('desktop.diagnostics.report.connectivity', { value: await describe(probeAndReport) }),
    t('desktop.diagnostics.report.environment', { value: navigator.userAgent }),
  ]

  return `${lines.join('\n')}\n`
}

async function probeAndReport(): Promise<string> {
  await probeSite()
  return t('desktop.diagnostics.report.reachable')
}

async function describe(probe: () => Promise<string>): Promise<string> {
  try {
    return await probe()
  } catch (error) {
    return t('desktop.diagnostics.report.unavailable', { error: errorText(error) })
  }
}
