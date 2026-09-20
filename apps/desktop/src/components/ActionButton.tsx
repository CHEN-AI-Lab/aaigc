import type { ReactNode } from 'react'

type ActionButtonProps = {
  readonly onClick: () => void
  readonly variant?: 'primary' | 'secondary'
  readonly children: ReactNode
}

const BASE =
  'rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950'

const TONES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500',
  secondary:
    'border border-neutral-300 text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800',
} as const

export function ActionButton({ onClick, variant = 'secondary', children }: ActionButtonProps) {
  return (
    <button type="button" onClick={onClick} className={`${BASE} ${TONES[variant]}`}>
      {children}
    </button>
  )
}
