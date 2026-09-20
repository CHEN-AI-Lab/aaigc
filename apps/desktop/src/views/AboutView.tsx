import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'

import { ActionButton } from '../components/ActionButton'
import { CheckUpdatesButton } from '../components/CheckUpdatesButton'
import { PanelField, PanelFrame, PanelSection } from '../components/PanelFrame'
import { errorText } from '../shell/error-text'
import { openExternal } from '../shell/native'

/** 关于面板（`?view=about`）。 */
export function AboutView() {
  const [version, setVersion] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    void getVersion()
      .then((value) => {
        if (!cancelled) {
          setVersion(value)
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(`读取版本失败：${errorText(cause)}`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PanelFrame title="关于 AAIGC" subtitle="桌面端 = 原生外壳 + 线上站点，不重新实现 Web 应用。">
      <PanelSection title="版本">
        <PanelField label="外壳版本" value={version === '' ? '读取中…' : `v${version}`} />
        <PanelField label="站点地址" value={__SITE_ORIGIN__} />
      </PanelSection>

      <PanelSection title="站点">
        <ActionButton
          onClick={() => {
            void openExternal(__SITE_ORIGIN__).catch((cause: unknown) => {
              setError(`打开浏览器失败：${errorText(cause)}`)
            })
          }}
        >
          在浏览器中打开官网
        </ActionButton>
      </PanelSection>

      <PanelSection title="更新">
        <CheckUpdatesButton />
      </PanelSection>

      {error !== '' && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </PanelFrame>
  )
}
