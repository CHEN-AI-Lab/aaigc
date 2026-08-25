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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm">👑</span>
            <h2 className="text-sm font-semibold text-text-primary">
              {t('trafficCardTitle')}
            </h2>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-sm bg-surface p-4 text-center">
            <p className="text-xs text-text-secondary/60 mb-1">{t('trafficLabel')}</p>
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {userCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-sm bg-surface p-4 text-center">
            <p className="text-xs text-text-secondary/60 mb-1">{t('thresholdLabel')}</p>
            <p className="text-xl font-semibold text-text-primary tabular-nums">
              {ALERT_THRESHOLD.toLocaleString()}
            </p>
          </div>
        </div>

        {overThreshold ? (
          <div className="rounded-sm border border-amber-300/60 bg-amber-50 p-3">
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
          <div className="rounded-sm border border-border bg-surface p-3">
            <p className="text-xs text-text-secondary/80 whitespace-pre-line">
              {t('belowThresholdHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}