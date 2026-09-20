import { useState } from 'react'

import { ActionButton } from '../components/ActionButton'
import { errorText } from '../shell/error-text'
import { openExternal } from '../shell/native'

type OfflineViewProps = {
  readonly detail: string
  readonly onRetry: () => void
}

/** 连不上站点时停在本地显示的页面。 */
export function OfflineView({ detail, onRetry }: OfflineViewProps) {
  const [browserError, setBrowserError] = useState('')

  async function openInBrowser() {
    setBrowserError('')

    try {
      await openExternal(__SITE_ORIGIN__)
    } catch (error) {
      setBrowserError(errorText(error))
    }
  }

  return (
    <main className="flex h-full flex-col items-center justify-center gap-5 bg-white px-8 text-center text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="max-w-lg space-y-2">
        <h1 className="text-xl font-semibold">无法连接</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          AAIGC 桌面端需要连上线上站点才能使用。请检查网络或代理设置后重试。
        </p>
      </div>

      <pre className="max-h-40 w-full max-w-lg overflow-auto rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-mono text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        {detail}
      </pre>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <ActionButton variant="primary" onClick={onRetry}>
          重试
        </ActionButton>
        <ActionButton
          onClick={() => {
            void openInBrowser()
          }}
        >
          在浏览器中打开
        </ActionButton>
      </div>

      {browserError !== '' && (
        <p className="text-xs text-red-600 dark:text-red-400">{browserError}</p>
      )}
    </main>
  )
}
