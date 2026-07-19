'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

type CalcTab = 'basic' | 'scientific' | 'percent' | 'bmi' | 'discount' | 'age'

const TABS: CalcTab[] = ['basic', 'scientific', 'percent', 'bmi', 'discount', 'age']

export default function Calculator() {
  const t = useTranslations('tools')
  const [tab, setTab] = useState<CalcTab>('basic')

  const tabLabel = (id: CalcTab) => {
    const key = `calc${id.charAt(0).toUpperCase() + id.slice(1)}`
    return t(key)
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-[rgba(127,99,21,0.15)] pb-1">
        {TABS.map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm rounded-t-sm transition-colors ${
              tab === id
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            {tabLabel(id)}
          </button>
        ))}
      </div>

      {tab === 'basic' && <BasicCalc />}
      {tab === 'scientific' && <ScientificCalc />}
      {tab === 'percent' && <PercentCalc />}
      {tab === 'bmi' && <BmiCalc />}
      {tab === 'discount' && <DiscountCalc />}
      {tab === 'age' && <AgeCalc />}
    </div>
  )
}

// ─── Basic Calculator ─────────────────────────────────
function BasicCalc() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [reset, setReset] = useState(false)

  const input = (n: string) => {
    if (reset || display === '0') { setDisplay(n); setReset(false) }
    else setDisplay(display + n)
  }

  const setOperator = (next: string) => {
    if (prev !== null && op && !reset) {
      const result = compute(prev, parseFloat(display), op)
      setDisplay(String(result))
      setPrev(result)
    } else {
      setPrev(parseFloat(display))
    }
    setOp(next)
    setReset(true)
  }

  const equals = () => {
    if (prev === null || !op) return
    const result = compute(prev, parseFloat(display), op)
    setDisplay(String(result))
    setPrev(null)
    setOp(null)
    setReset(true)
  }

  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setReset(false) }

  return (
    <div className="max-w-xs mx-auto">
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-3 mb-3 text-right text-2xl font-mono text-text-primary min-h-[3rem] overflow-hidden">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map((k) => (
          <button key={k} onClick={() => {
            if (k === '=') equals()
            else if ('+-*/'.includes(k)) setOperator(k)
            else input(k)
          }} className={`p-3 text-sm rounded-sm font-medium transition-colors ${
            '+-*/='.includes(k) ? 'bg-accent text-white hover:opacity-90' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30'
          }`}>{k}</button>
        ))}
        <button onClick={clear} className="col-span-4 p-2 text-xs bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] rounded-sm hover:border-accent/30">AC</button>
      </div>
    </div>
  )
}

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b !== 0 ? a / b : NaN
    default: return b
  }
}

// ─── Scientific Calculator ────────────────────────────
function ScientificCalc() {
  const [display, setDisplay] = useState('0')
  const [rad, setRad] = useState(false)

  const input = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n)
  }

  const applyFn = (fn: (x: number) => number) => {
    const val = parseFloat(display)
    if (isNaN(val)) return
    setDisplay(String(fn(val)))
  }

  const toRad = (deg: number) => deg * Math.PI / 180

  const btns = [
    { label: 'sin', fn: (x: number) => Math.sin(rad ? x : toRad(x)) },
    { label: 'cos', fn: (x: number) => Math.cos(rad ? x : toRad(x)) },
    { label: 'tan', fn: (x: number) => Math.tan(rad ? x : toRad(x)) },
    { label: 'log', fn: Math.log10 },
    { label: 'ln', fn: Math.log },
    { label: '√', fn: Math.sqrt },
    { label: 'x²', fn: (x: number) => x * x },
    { label: '1/x', fn: (x: number) => 1 / x },
    { label: 'π', fn: (x: number) => Math.PI },
    { label: 'e', fn: (x: number) => Math.E },
  ]

  return (
    <div className="max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-2 text-right text-xl font-mono text-text-primary flex-1 mr-2 min-h-[2.5rem]">
          {display}
        </div>
        <button onClick={() => setRad(!rad)} className={`text-xs px-2 py-1 rounded-sm ${rad ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>RAD</button>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {btns.map((b) => (
          <button key={b.label} onClick={() => applyFn(b.fn)}
            className="p-2 text-xs bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] rounded-sm hover:border-accent/30 font-medium">{b.label}</button>
        ))}
        {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+'].map((k) => (
          <button key={k} onClick={() => input(k)}
            className={`p-2 text-sm rounded-sm font-medium ${
              '+-*/'.includes(k) ? 'bg-accent text-white' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)]'
            }`}>{k}</button>
        ))}
        <button onClick={() => setDisplay('0')} className="p-2 text-xs bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] rounded-sm col-span-2">AC</button>
        <button onClick={() => {
          try { setDisplay(String(eval(display))) } catch { setDisplay('Error') }
        }} className="p-2 text-sm bg-accent text-white rounded-sm col-span-3">=</button>
      </div>
    </div>
  )
}

// ─── Percentage Calculator ────────────────────────────
function PercentCalc() {
  const t = useTranslations('tools')
  const [a, setA] = useState('')
  const [b, setB] = useState('')

  const result = (() => {
    const na = parseFloat(a)
    const nb = parseFloat(b)
    if (isNaN(na) || isNaN(nb)) return null
    return { pct: (na / nb * 100).toFixed(2), of: (na / 100 * nb).toFixed(2), change: ((nb - na) / na * 100).toFixed(2) }
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcValueA')}</label>
          <input value={a} onChange={e => setA(e.target.value)} placeholder="100" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcValueB')}</label>
          <input value={b} onChange={e => setB(e.target.value)} placeholder="200" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {result && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] space-y-1 text-sm">
          <p>{t('calcAisPctOfB', { pct: result.pct })}</p>
          <p>{t('calcPctOfB', { val: result.of, a })}</p>
          <p>{t('calcChange', { pct: result.change })}</p>
        </div>
      )}
    </div>
  )
}

// ─── BMI Calculator ───────────────────────────────────
function BmiCalc() {
  const t = useTranslations('tools')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric')

  const bmi = (() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (isNaN(h) || isNaN(w) || h <= 0) return null
    const m = unit === 'metric' ? h / 100 : h * 0.0254
    const kg = unit === 'metric' ? w : w * 0.453592
    return kg / (m * m)
  })()

  const category = bmi ? (
    bmi < 18.5 ? t('calcUnderweight') : bmi < 25 ? t('calcNormal') : bmi < 30 ? t('calcOverweight') : t('calcObese')
  ) : null

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="flex gap-1 mb-2">
        <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'metric' ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>{t('calcMetric')}</button>
        <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'imperial' ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>{t('calcImperial')}</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcHeight')} ({unit === 'metric' ? 'cm' : 'in'})</label>
          <input value={height} onChange={e => setHeight(e.target.value)} placeholder="170" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcWeight')} ({unit === 'metric' ? 'kg' : 'lb'})</label>
          <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {bmi && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{bmi.toFixed(1)}</p>
          <p className="text-sm text-text-secondary mt-1">{category}</p>
        </div>
      )}
    </div>
  )
}

// ─── Discount Calculator ──────────────────────────────
function DiscountCalc() {
  const t = useTranslations('tools')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')

  const result = (() => {
    const p = parseFloat(price)
    const d = parseFloat(discount)
    if (isNaN(p) || isNaN(d)) return null
    const saved = p * d / 100
    return { saved, final: p - saved }
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcOriginalPrice')}</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="100" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">{t('calcDiscountPct')}</label>
          <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="20" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {result && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] space-y-1 text-sm">
          <p>{t('calcYouSave')}: <strong className="text-green-600">${result.saved.toFixed(2)}</strong></p>
          <p>{t('calcFinalPrice')}: <strong className="text-accent">${result.final.toFixed(2)}</strong></p>
        </div>
      )}
    </div>
  )
}

// ─── Age Calculator ───────────────────────────────────
function AgeCalc() {
  const t = useTranslations('tools')
  const [birth, setBirth] = useState('')
  const today = new Date()

  const age = (() => {
    if (!birth) return null
    const b = new Date(birth)
    if (isNaN(b.getTime())) return null
    let years = today.getFullYear() - b.getFullYear()
    const m = today.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) years--
    let months = (today.getFullYear() - b.getFullYear()) * 12 + (today.getMonth() - b.getMonth())
    if (today.getDate() < b.getDate()) months--
    const days = Math.floor((today.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
    return { years, months, days }
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div>
        <label className="block text-xs text-text-secondary mb-1">{t('calcDateOfBirth')}</label>
        <input type="date" value={birth} onChange={e => setBirth(e.target.value)}
          className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
      </div>
      {age && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-3xl font-bold text-accent">{age.years}</p>
          <p className="text-sm text-text-secondary">{t('calcYearsOld')}</p>
          <p className="text-xs text-text-secondary mt-1">{age.months} months, {age.days} days</p>
        </div>
      )}
    </div>
  )
}