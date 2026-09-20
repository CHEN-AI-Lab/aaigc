import { getVersion } from '@tauri-apps/api/app'
import { useState } from 'react'

import { errorText } from '../shell/error-text'
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
    setMessage('正在读取版本…')

    try {
      const version = await getVersion()
      setMessage(`当前版本 v${version}。桌面端自动更新通道尚未接入，此入口目前只是占位。`)
    } catch (error) {
      setMessage(`读取版本失败：${errorText(error)}`)
    }
  }

  return (
    <div className="space-y-2">
      <ActionButton
        onClick={() => {
          void check()
        }}
      >
        检查更新
      </ActionButton>
      {message !== '' && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{message}</p>
      )}
    </div>
  )
}
