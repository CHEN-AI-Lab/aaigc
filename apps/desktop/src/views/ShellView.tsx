import { useCallback, useEffect, useRef, useState } from 'react'

import { connectToSite } from '../shell/connect'
import { t } from '../shell/i18n'
import { OfflineView } from './OfflineView'

type Phase = 'connecting' | 'offline'

/**
 * 主窗口的连接壳。
 *
 * 主窗口最初加载的是这个本地页面；探测通过后把窗口导航到线上站点
 * （Tauri 侧的导航守卫只放行站点同源地址），失败就停在本地「无法连接」页。
 * 这样「连不上」时用户看到的是我们自己的界面，而不是 WebView 的空白错误页。
 */
export function ShellView() {
  const [phase, setPhase] = useState<Phase>('connecting')
  const [detail, setDetail] = useState('')
  const runIdRef = useRef(0)

  const connect = useCallback(async () => {
    runIdRef.current += 1
    const runId = runIdRef.current

    setPhase('connecting')
    setDetail('')

    const result = await connectToSite()

    // 用户可能连点重试：只认最后一次。
    if (runIdRef.current !== runId) {
      return
    }

    if (result.ok) {
      window.location.replace(result.origin)
      return
    }

    setDetail(result.detail)
    setPhase('offline')
  }, [])

  useEffect(() => {
    void connect()

    return () => {
      runIdRef.current += 1
    }
  }, [connect])

  if (phase === 'connecting') {
    return <ConnectingView />
  }

  return (
    <OfflineView
      detail={detail}
      onRetry={() => {
        void connect()
      }}
    />
  )
}

function ConnectingView() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
      <div
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-700 dark:border-t-transparent"
      />
      <p className="text-sm">{t('desktop.connect.connecting')}</p>
    </main>
  )
}
