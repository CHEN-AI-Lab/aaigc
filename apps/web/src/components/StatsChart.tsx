'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslations } from 'next-intl'

type Props = {
  data: { date: string; visits: number }[]
  loading: boolean
}

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

export default function StatsChart({ data, loading }: Props) {
  const ts = useTranslations('stats')

  if (loading) {
    return (
      <div className="bg-bg p-6 rounded-sm border border-[rgba(127,99,21,0.1)] mb-8">
        <h3 className="text-sm font-semibold text-text-secondary mb-4">{ts('trafficOverTime')}</h3>
        <div className="h-48 flex items-center justify-center text-text-secondary text-xs">{ts('noData')}</div>
      </div>
    )
  }

  const maxVisits = Math.max(...data.map((d) => d.visits), 1)
  const yTicks = maxVisits <= 5 ? [0, maxVisits] : undefined

  return (
    <div className="bg-bg p-6 rounded-sm border border-[rgba(127,99,21,0.1)] mb-8">
      <h3 className="text-sm font-semibold text-text-secondary mb-4">{ts('trafficOverTime')}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fa520f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#fa520f" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d, 'en')}
              tick={{ fontSize: 10, fill: '#767d88' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#767d88' }}
              axisLine={false}
              tickLine={false}
              ticks={yTicks}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid rgba(127,99,21,0.15)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#1f1f1f',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...({ labelFormatter: (d: string) => formatDate(d, 'en'), formatter: (value: number) => [value, 'visits'] } as any)}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#fa520f"
              strokeWidth={1.5}
              fill="url(#colorVisits)"
              dot={false}
              activeDot={{ r: 3, fill: '#fa520f' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}