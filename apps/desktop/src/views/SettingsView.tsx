import { useState } from 'react'

import { ActionButton } from '../components/ActionButton'
import { CheckUpdatesButton } from '../components/CheckUpdatesButton'
import { PanelField, PanelFrame, PanelSection } from '../components/PanelFrame'
import { buildDiagnostics } from '../shell/diagnostics'
import { errorText } from '../shell/error-text'
import { exportDiagnostics } from '../shell/native'
import { notify } from '../shell/notify'

/** 设置面板（`?view=settings`）。 */
export function SettingsView() {
  const [status, setStatus] = useState('')

  async function onExportDiagnostics() {
    setStatus('正在生成诊断报告…')

    try {
      const savedTo = await exportDiagnostics(await buildDiagnostics())
      setStatus(savedTo === null ? '已取消保存。' : `诊断报告已保存到 ${savedTo}`)
    } catch (error) {
      setStatus(`导出失败：${errorText(error)}`)
    }
  }

  async function onTestNotification() {
    setStatus('正在发送测试通知…')

    try {
      await notify('AAIGC 桌面端', '这是一条测试通知，说明系统通知通道可用。')
      setStatus('测试通知已发送。')
    } catch (error) {
      setStatus(`发送通知失败：${errorText(error)}`)
    }
  }

  return (
    <PanelFrame title="设置" subtitle="桌面端外壳的本地设置。站点本身的功能请到线上界面里操作。">
      <PanelSection title="连接" description="站点地址在构建期注入，运行期不可更改。">
        <PanelField label="站点地址" value={__SITE_ORIGIN__} />
      </PanelSection>

      <PanelSection
        title="诊断"
        description="导出内容只包含版本、站点地址与连通性结果，不含账号或凭据信息。"
      >
        <ActionButton
          onClick={() => {
            void onExportDiagnostics()
          }}
        >
          导出诊断报告…
        </ActionButton>
      </PanelSection>

      <PanelSection title="通知" description="用于验证系统通知通道是否可用。">
        <ActionButton
          onClick={() => {
            void onTestNotification()
          }}
        >
          发送测试通知
        </ActionButton>
      </PanelSection>

      <PanelSection title="更新">
        <CheckUpdatesButton />
      </PanelSection>

      {status !== '' && (
        <p className="mt-2 break-all text-xs text-neutral-500 dark:text-neutral-400">{status}</p>
      )}
    </PanelFrame>
  )
}
