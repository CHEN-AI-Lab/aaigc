import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'

import { ActionButton } from '../components/ActionButton'
import { CheckUpdatesButton } from '../components/CheckUpdatesButton'
import { PanelField, PanelFrame, PanelSection } from '../components/PanelFrame'
import { errorText } from '../shell/error-text'
import { t } from '../shell/i18n'
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
          setError(t('desktop.about.version.readFailed', { error: errorText(cause) }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PanelFrame title={t('desktop.about.title')} subtitle={t('desktop.about.subtitle')}>
      <PanelSection title={t('desktop.about.version.title')}>
        <PanelField
          label={t('desktop.about.version.shell')}
          value={version === '' ? t('desktop.common.loading') : `v${version}`}
        />
        <PanelField label={t('desktop.common.siteOrigin')} value={__SITE_ORIGIN__} />
      </PanelSection>

      <PanelSection title={t('desktop.about.site.title')}>
        <ActionButton
          onClick={() => {
            void openExternal(__SITE_ORIGIN__).catch((cause: unknown) => {
              setError(t('desktop.about.site.openFailed', { error: errorText(cause) }))
            })
          }}
        >
          {t('desktop.about.site.open')}
        </ActionButton>
      </PanelSection>

      <PanelSection title={t('desktop.common.updates')}>
        <CheckUpdatesButton />
      </PanelSection>

      {error !== '' && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </PanelFrame>
  )
}
