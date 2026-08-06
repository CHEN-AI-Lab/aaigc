'use client'

import { usePathname } from '@/i18n/navigation'
import { useVisitTracking } from 'shared/hooks/useVisitTracking'

export default function VisitTracker() {
  const pathname = usePathname()
  useVisitTracking('aaigc', pathname)
  return null
}