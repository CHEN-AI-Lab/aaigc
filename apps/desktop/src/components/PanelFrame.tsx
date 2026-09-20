import { getCurrentWindow } from '@tauri-apps/api/window'
import type { ReactNode } from 'react'

import { ActionButton } from './ActionButton'
import { t } from '../shell/i18n'

type PanelFrameProps = {
  readonly title: string
  readonly subtitle: string
  readonly children: ReactNode
}

/** 本地面板窗口的统一外壳：标题栏 + 可滚动内容 + 关闭按钮。 */
export function PanelFrame({ title, subtitle, children }: PanelFrameProps) {
  return (
    <main className="flex h-full flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

      <footer className="flex justify-end border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <ActionButton
          onClick={() => {
            void getCurrentWindow().close()
          }}
        >
          {t('desktop.common.close')}
        </ActionButton>
      </footer>
    </main>
  )
}

type PanelSectionProps = {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}

export function PanelSection({ title, description, children }: PanelSectionProps) {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description !== undefined && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** 面板里的只读信息行。 */
export function PanelField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-baseline gap-3 py-1">
      <span className="w-32 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{value}</code>
    </div>
  )
}
