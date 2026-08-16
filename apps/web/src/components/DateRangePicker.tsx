'use client'

import { useState, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import { enUS, zhCN, ja } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { registerLocale } from 'react-datepicker'

registerLocale('en', enUS as unknown as Locale)
registerLocale('zh-CN', zhCN as unknown as Locale)
registerLocale('ja', ja as unknown as Locale)

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS as unknown as Locale,
  'zh-CN': zhCN as unknown as Locale,
  ja: ja as unknown as Locale,
}

type Props = {
  initialStart?: string
  initialEnd?: string
  locale?: string
  onApply: (start: string, end: string) => void
}

function parseLocal(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toLocalStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTHS_CN = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function CustomHeader({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  locale,
}: {
  date: Date
  changeYear: (y: number) => void
  changeMonth: (m: number) => void
  decreaseMonth: () => void
  increaseMonth: () => void
  prevMonthButtonDisabled: boolean
  nextMonthButtonDisabled: boolean
  locale: string
}) {
  const months = locale === 'ja' ? MONTHS_JA : locale === 'zh-CN' ? MONTHS_CN : MONTHS_EN
  const year = date.getFullYear()
  const month = date.getMonth()

  // Years from 2026 to current year
  const years = []
  const now = new Date().getFullYear()
  for (let y = 2026; y <= now; y++) years.push(y)

  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <button
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        className="px-1 py-0.5 text-xs text-text-secondary hover:text-accent disabled:opacity-30"
      >
        ‹
      </button>
      <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
        {/* Year first, then month */}
        <select
          value={year}
          onChange={(e) => changeYear(Number(e.target.value))}
          className="text-xs bg-transparent border-none text-text-primary font-medium cursor-pointer outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {locale === 'en' ? ' ' : ''}
        <select
          value={month}
          onChange={(e) => changeMonth(Number(e.target.value))}
          className="text-xs bg-transparent border-none text-text-primary font-medium cursor-pointer outline-none"
        >
          {months.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
      </div>
      <button
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        className="px-1 py-0.5 text-xs text-text-secondary hover:text-accent disabled:opacity-30"
      >
        ›
      </button>
    </div>
  )
}

export default function DateRangePicker({ initialStart, initialEnd, locale = 'en', onApply }: Props) {
  const dateLocale = LOCALE_MAP[locale] || LOCALE_MAP['en']

  const [startDate, setStartDate] = useState<Date | null>(
    initialStart ? parseLocal(initialStart) : null
  )
  const [endDate, setEndDate] = useState<Date | null>(
    initialEnd ? parseLocal(initialEnd) : null
  )
  const [selecting, setSelecting] = useState(false)

  const handleChange = useCallback((dates: [Date | null, Date | null]) => {
    const [s, e] = dates
    setStartDate(s)
    setEndDate(e)
    if (s && e) {
      setSelecting(false)
      onApply(toLocalStr(s), toLocalStr(e))
    } else {
      setSelecting(true)
    }
  }, [onApply])

  return (
    <DatePicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={handleChange}
      locale={dateLocale}
      inline
      monthsShown={1}
      minDate={new Date(2026, 0, 1)}
      maxDate={new Date()}
      dateFormat="yyyy-MM-dd"
      renderCustomHeader={(props) => <CustomHeader {...props} locale={locale} />}
    >
      <div className="text-center text-xs text-text-secondary py-1 border-t border-[rgba(127,99,21,0.1)] mt-1">
        {selecting
          ? locale === 'zh-CN' ? '选择结束日期' : locale === 'ja' ? '終了日を選択' : 'Select end date'
          : startDate && endDate
            ? `${toLocalStr(startDate)} — ${toLocalStr(endDate)}`
            : locale === 'zh-CN' ? '选择日期范围' : locale === 'ja' ? '日付範囲を選択' : 'Select date range'}
      </div>
    </DatePicker>
  )
}