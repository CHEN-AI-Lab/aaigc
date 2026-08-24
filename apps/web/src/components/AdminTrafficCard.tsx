import { auth } from '@/auth'
import { prisma } from 'shared/utils/prisma'
import { getTranslations } from 'next-intl/server'
import CopyButton from './admin/CopyButton'

// 用户拍板的提醒阈值（注册用户数 ≥ 此值时显示开启 CSP 强防护的提示）
const ALERT_THRESHOLD = 1000
// 要复制的部署指令（在 Vercel 环境变量里把 CSP_STRICT 设为 true）
const COPY_VALUE = 'CSP_STRICT=true'

// 管理员专用「流量与安全状态」卡片：
// - 只在管理员登录时渲染
// - 网站自己渲染时直接数生产用户（用 Vercel 已有的 DATABASE_URL，零额外配置）
// - 始终显示当前用户数与阈值；达阈值时变黄提醒，给出可一键复制的部署指令
export default async function AdminTrafficCard() {
  const session = await auth()
  if (!session?.user?.id) return null
  if (session.user.role !== 'admin') return null

  const t = await getTranslations('admin')
  const userCount = await prisma.user.count()
  const overThreshold = userCount >= ALERT_THRESHOLD

  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-accent to-accent-light" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">👑</span>
          <h2 className="text-sm font-semibold text-text-primary">
            {t('trafficCardTitle')}
          </h2>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
          <span>
            {t('trafficLabel')}:{' '}
            <span className="font-semibold text-text-primary tabular-nums">
              {userCount.toLocaleString()}
            </span>
          </span>
          <span>
            {t('thresholdLabel')}:{' '}
            <span className="font-semibold text-text-primary tabular-nums">
              {ALERT_THRESHOLD.toLocaleString()}
            </span>
          </span>
        </div>

        {overThreshold ? (
          <div className="mt-4 rounded-sm border border-amber-300/60 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800">
              ⚠️ {t('alertTitle')}
            </p>
            <p className="mt-1.5 text-xs text-amber-800/80">
              {t('alertDesc', { count: userCount.toLocaleString() })}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <code className="rounded-sm bg-white/70 border border-amber-300/60 px-2 py-1 text-xs font-mono text-amber-900">
                {COPY_VALUE}
              </code>
              <CopyButton
                value={COPY_VALUE}
                label={t('copyButton')}
                copiedLabel={t('copied')}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-text-secondary/80">
            {t('belowThresholdHint')}
          </p>
        )}
      </div>
    </div>
  )
}
