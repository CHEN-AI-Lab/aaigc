import { getVersion } from '@tauri-apps/api/app'
import { useState } from 'react'

import { errorText } from '../shell/error-text'
import { t } from '../shell/i18n'
import { ActionButton } from './ActionButton'

/**
 * 「检查更新」入口 —— **只做占位**。
 *
 * 目前没有接入任何更新通道（既没有 updater 插件，也没有更新源地址），
 * 所以这里只把当前版本读出来，并明确告诉用户这个入口还没接通，
 * 而不是伪造一个「已是最新版本」。
 */
export function CheckUpdatesButton() {
  const [message, setMessage] = useState('')

  async function check() {
    setMessage(t('desktop.updates.reading'))

    try {
      const version = await getVersion()
      setMessage(t('desktop.updates.placeholder', { version }))
    } catch (error) {
      setMessage(t('desktop.updates.failed', { error: errorText(error) }))
    }
  }

  return (
    <div className="space-y-2">
      <ActionButton
        onClick={() => {
          void check()
        }}
      >
        {t('desktop.updates.check')}
      </ActionButton>
      {message !== '' && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{message}</p>
      )}
    </div>
  )
}
