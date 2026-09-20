import { useState } from 'react'

import { ActionButton } from '../components/ActionButton'
import { CheckUpdatesButton } from '../components/CheckUpdatesButton'
import { PanelField, PanelFrame, PanelSection } from '../components/PanelFrame'
import { buildDiagnostics } from '../shell/diagnostics'
import { errorText } from '../shell/error-text'
import { t } from '../shell/i18n'
import { exportDiagnostics } from '../shell/native'
import { notify } from '../shell/notify'

/** 设置面板（`?view=settings`）。 */
export function SettingsView() {
  const [status, setStatus] = useState('')

  async function onExportDiagnostics() {
    setStatus(t('desktop.settings.diagnostics.generating'))

    try {
      const savedTo = await exportDiagnostics(await buildDiagnostics())
      setStatus(
        savedTo === null
          ? t('desktop.settings.diagnostics.cancelled')
          : t('desktop.settings.diagnostics.saved', { path: savedTo }),
      )
    } catch (error) {
      setStatus(t('desktop.settings.diagnostics.failed', { error: errorText(error) }))
    }
  }

  async function onTestNotification() {
    setStatus(t('desktop.settings.notifications.sending'))

    try {
      await notify(
        t('desktop.settings.notifications.testTitle'),
        t('desktop.settings.notifications.testBody'),
      )
      setStatus(t('desktop.settings.notifications.sent'))
    } catch (error) {
      setStatus(t('desktop.settings.notifications.failed', { error: errorText(error) }))
    }
  }

  return (
    <PanelFrame
      title={t('desktop.settings.title')}
      subtitle={t('desktop.settings.subtitle')}
    >
      <PanelSection
        title={t('desktop.settings.connection.title')}
        description={t('desktop.settings.connection.description')}
      >
        <PanelField label={t('desktop.common.siteOrigin')} value={__SITE_ORIGIN__} />
      </PanelSection>

      <PanelSection
        title={t('desktop.settings.diagnostics.title')}
        description={t('desktop.settings.diagnostics.description')}
      >
        <ActionButton
          onClick={() => {
            void onExportDiagnostics()
          }}
        >
          {t('desktop.settings.diagnostics.export')}
        </ActionButton>
      </PanelSection>

      <PanelSection
        title={t('desktop.settings.notifications.title')}
        description={t('desktop.settings.notifications.description')}
      >
        <ActionButton
          onClick={() => {
            void onTestNotification()
          }}
        >
          {t('desktop.settings.notifications.test')}
        </ActionButton>
      </PanelSection>

      <PanelSection title={t('desktop.common.updates')}>
        <CheckUpdatesButton />
      </PanelSection>

      {status !== '' && (
        <p className="mt-2 break-all text-xs text-neutral-500 dark:text-neutral-400">{status}</p>
      )}
    </PanelFrame>
  )
}
