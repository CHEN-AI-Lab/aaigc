'use client'

import { usePathname } from '@/i18n/navigation'
import { useSession } from '@/auth-client'
import { useVisitTracking } from 'shared/hooks/useVisitTracking'

export default function VisitTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  useVisitTracking('aaigc', pathname, undefined, session?.user?.id)
  return null
}