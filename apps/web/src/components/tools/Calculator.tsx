'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { familyRelations } from 'data/family'

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b; case '-': return a - b
    case '*': return a * b; case '/': return b !== 0 ? a / b : NaN
    default: return b
  }
}

const RATES: Record<string, number> = {
  USD: 1, CNY: 7.24, EUR: 0.92, JPY: 149.5, GBP: 0.79, KRW: 1320, HKD: 7.82, TWD: 32.1, SGD: 1.34, AUD: 1.53, CAD: 1.36, THB: 35.5, VND: 25450,
}

type Tab = 'calc' | 'currency' | 'length' | 'weight' | 'area' | 'volume' | 'temp' | 'speed' | 'bmi' | 'tax' | 'mortgage' | 'chinese' | 'time' | 'title' | 'base'

const TABS: { id: Tab }[] = [
  { id: 'calc' }, { id: 'bmi' },
  { id: 'tax' }, { id: 'mortgage' },
  { id: 'chinese' }, { id: 'title' },
  { id: 'currency' }, { id: 'base' },
  { id: 'length' }, { id: 'weight' },
  { id: 'area' }, { id: 'volume' },
  { id: 'temp' }, { id: 'speed' },
  { id: 'time' },
]

export default function Calculator() {
  const [tab, setTab] = useState<Tab>('calc')
  const t = useTranslations('tools')
  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-3 py-1.5 text-xs rounded-t-sm whitespace-nowrap transition-colors shrink-0 ${
              tab === tb.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}>{t(`tab${tb.id.charAt(0).toUpperCase() + tb.id.slice(1)}`)}
          </button>
        ))}
      </div>
      {tab === 'calc' && <CalcPanel />}
      {tab === 'currency' && <CurrencyCalc />}
      {tab === 'length' && <UnitTable units={LENGTH} title={t('calcLengthConvert')} />}
      {tab === 'weight' && <UnitTable units={WEIGHT} title={t('calcWeightConvert')} />}
      {tab === 'area' && <UnitTable units={AREA} title={t('calcAreaConvert')} />}
      {tab === 'volume' && <UnitTable units={VOLUME} title={t('calcVolumeConvert')} />}
      {tab === 'temp' && <TempCalc />}
      {tab === 'speed' && <UnitTable units={SPEED} title={t('calcSpeedConvert')} />}
      {tab === 'bmi' && <BmiCalc />}
      {tab === 'tax' && <TaxCalc />}
      {tab === 'mortgage' && <MortgageCalc />}
      {tab === 'chinese' && <ChineseNumCalc />}
      {tab === 'time' && <TimeCalc />}
      {tab === 'title' && <TitleCalc />}
      {tab === 'base' && <BaseCalc />}
    </div>
  )
}

// ─── Calculator Panel ────────────────────────────────
function CalcPanel() {
  const t = useTranslations('tools')
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [reset, setReset] = useState(false)
  const [sci, setSci] = useState(false)
  const [rad, setRad] = useState(false)
  const [mem, setMem] = useState<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k >= '0' && k <= '9') input(k)
      else if (k === '.') input('.')
      else if (k === '+') handleOp('+')
      else if (k === '-') handleOp('-')
      else if (k === '*') handleOp('*')
      else if (k === '/') { e.preventDefault(); handleOp('/') }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); equals() }
      else if (k === 'Backspace') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0') }
      else if (k === 'Escape' || k === 'Delete') clear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const input = (n: string) => {
    if (reset || display === '0') { setDisplay(n); setReset(false) }
    else setDisplay(display + n)
  }
  const handleOp = (next: string) => {
    const cur = parseFloat(display)
    if (prev !== null && op && !reset) {
      const r = compute(prev, cur, op); setExpr(`${prev} ${op} ${cur} =`); setDisplay(String(r)); setPrev(r)
    } else { setExpr(cur + ' ' + next); setPrev(cur) }
    setOp(next); setReset(true)
  }
  const equals = () => {
    if (prev === null || !op) return; const cur = parseFloat(display); const r = compute(prev, cur, op)
    setExpr(`${prev} ${op} ${cur} =`); setDisplay(String(r)); setPrev(null); setOp(null); setReset(true)
  }
  const clear = () => { setDisplay('0'); setExpr(''); setPrev(null); setOp(null); setReset(false) }
  const apply = (fn: (x: number) => number, name: string) => { const v = parseFloat(display); if (isNaN(v)) return; setExpr(`${name}(${v}) =`); setDisplay(String(fn(v))) }
  const toRad = (x: number) => rad ? x : x * Math.PI / 180

  const sciFuncs = [
    { l: 'sin', f: (x: number) => Math.sin(toRad(x)) }, { l: 'cos', f: (x: number) => Math.cos(toRad(x)) },
    { l: 'tan', f: (x: number) => Math.tan(toRad(x)) }, { l: 'log', f: Math.log10 },
    { l: 'ln', f: Math.log }, { l: '√', f: Math.sqrt },
    { l: 'x²', f: (x: number) => x * x }, { l: 'x³', f: (x: number) => x * x * x },
    { l: '1/x', f: (x: number) => 1 / x }, { l: '|x|', f: Math.abs },
    { l: 'n!', f: (x: number) => { let r = 1; for (let i = 2; i <= x; i++) r *= i; return r } },
    { l: '10ˣ', f: (x: number) => Math.pow(10, x) },
  ]

  const btn = (label: string, base: string, onClick: () => void) => (
    <button key={label} onClick={onClick} className={`p-3 text-sm rounded-sm font-medium transition-colors active:scale-90 duration-100 ${base}`}>{label}</button>
  )
  const sbtn = (l: string, b: string, onClick: () => void) => (
    <button key={l} onClick={onClick} className={`p-2 text-xs rounded-sm font-medium transition-colors active:scale-90 duration-100 ${b}`}>{l}</button>
  )

  return (
    <div className="mx-auto" style={{ maxWidth: '260px' }}>
      <div className="bg-surface border border-border rounded-sm p-3 mb-3 min-h-[4rem]">
        <div className="flex items-center justify-between text-xs text-text-secondary/60 min-h-[1rem] leading-tight">
          <span>{sci ? (rad ? 'RAD' : 'DEG') : ''}</span>
          <span className="overflow-hidden text-ellipsis text-right ml-2">{expr}&nbsp;</span>
        </div>
        <div className="text-2xl font-mono text-text-primary text-right leading-loose overflow-hidden">{display}</div>
      </div>
      {sci && (
        <div className="grid grid-cols-4 gap-1 mb-2">
          {sciFuncs.map(f => sbtn(f.l, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => apply(f.f, f.l)))}
          {sbtn('π', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { setDisplay(String(Math.PI)); setExpr('π') })}
          {sbtn('e', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { setDisplay(String(Math.E)); setExpr('e') })}
          {sbtn(rad ? 'RAD' : 'DEG', rad ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => setRad(!rad))}
          {sbtn('MC', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => setMem(null))}
          {sbtn('MR', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => { if (mem !== null) { setDisplay(String(mem)); setExpr('MR') } })}
          {sbtn('M+', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => { setMem(parseFloat(display)); setExpr('M+') })}
          {sbtn('M-', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => { setMem(parseFloat(display)); setExpr('M-') })}
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {btn('AC', 'col-span-2 bg-surface text-red-400 border border-[rgba(127,99,21,0.1)] hover:border-red-300', clear)}
        {btn('⌫', 'bg-surface text-red-400 border border-[rgba(127,99,21,0.1)] hover:border-red-300', () => setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'))}
        {btn('÷', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 font-bold', () => handleOp('/'))}
        {['7','8','9'].map(n => btn(n, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input(n)))}
        {btn('×', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 font-bold', () => handleOp('*'))}
        {['4','5','6'].map(n => btn(n, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input(n)))}
        {btn('−', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 font-bold', () => handleOp('-'))}
        {['1','2','3'].map(n => btn(n, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input(n)))}
        {btn('+', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 font-bold', () => handleOp('+'))}
        {btn(sci ? t('calcScientific') : t('calcBasic'), 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 text-xs', () => setSci(!sci))}
        {btn('0', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('0'))}
        {btn('.', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('.'))}
        {btn('=', 'bg-accent text-white font-bold hover:opacity-90', equals)}
      </div>
    </div>
  )
}

// ─── Improved Currency Converter ─────────────────────
function CurrencyCalc() {
  const t = useTranslations('tools')
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CNY')
  const a = parseFloat(amount)
  const result = isNaN(a) ? null : a / RATES[from] * RATES[to]

  const swap = () => { setFrom(to); setTo(from) }

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{t('currencyAmount')}</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} maxLength={15} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div />
          <div />
          <div>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary">
              {Object.keys(RATES).map(c => <option key={c} value={c}>{c} ({t(`currency${c}`)})</option>)}
            </select>
          </div>
          <button onClick={swap} className="p-2 text-lg text-accent hover:opacity-70 self-center">⇄</button>
          <div>
            <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary">
              {Object.keys(RATES).map(c => <option key={c} value={c}>{c} ({t(`currency${c}`)})</option>)}
            </select>
          </div>
        </div>
        {result !== null && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)] text-center">
            <p className="text-xs text-text-secondary/60">{amount} {from} ({t(`currency${from}`)}) =</p>
            <p className="text-2xl font-bold text-accent">{fmt(result)}</p>
            <p className="text-xs text-text-secondary mt-1">1 {from} ({t(`currency${from}`)}) = {fmt(1 / RATES[from] * RATES[to])} {to} ({t(`currency${to}`)})</p>
          </div>
        )}
      </div>
      {/* All currencies table */}
      {result !== null && (
        <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-3">
          <p className="text-xs text-text-secondary/60 mb-2">{amount} {from} ({t(`currency${from}`)}) {t('currencyAll')}</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.keys(RATES).filter(c => c !== from).map(c => (
              <div key={c} className="flex justify-between p-1.5 bg-card rounded-sm">
                <span className="text-text-secondary">{c} ({t(`currency${c}`)})</span>
                <span className="text-text-primary font-mono">{fmt(a / RATES[from] * RATES[c])}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Improved Unit Converter (table view) ────────────
type Unit = { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }

const LENGTH: Unit[] = [
  { label: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
  { label: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
  { label: 'm', toBase: v => v, fromBase: v => v },
  { label: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
  { label: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
  { label: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
  { label: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
  { label: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
]

const WEIGHT: Unit[] = [
  { label: 'mg', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
  { label: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
  { label: 'kg', toBase: v => v, fromBase: v => v },
  { label: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
  { label: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
  { label: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
  { label: '石', toBase: v => v * 6.35029, fromBase: v => v / 6.35029 },
]

const AREA: Unit[] = [
  { label: 'mm²', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
  { label: 'cm²', toBase: v => v / 1e4, fromBase: v => v * 1e4 },
  { label: 'm²', toBase: v => v, fromBase: v => v },
  { label: 'km²', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
  { label: 'ha', toBase: v => v * 1e4, fromBase: v => v / 1e4 },
  { label: 'acre', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
  { label: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
  { label: '亩', toBase: v => v * 666.667, fromBase: v => v / 666.667 },
]

const VOLUME: Unit[] = [
  { label: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
  { label: 'L', toBase: v => v, fromBase: v => v },
  { label: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
  { label: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
  { label: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
  { label: 'cup', toBase: v => v * 0.236588, fromBase: v => v / 0.236588 },
  { label: 'fl oz', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
  { label: 'tbsp', toBase: v => v * 0.0147868, fromBase: v => v / 0.0147868 },
  { label: 'tsp', toBase: v => v * 0.00492892, fromBase: v => v / 0.00492892 },
]

const SPEED: Unit[] = [
  { label: 'm/s', toBase: v => v, fromBase: v => v },
  { label: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
  { label: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
  { label: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
  { label: 'ft/s', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
  { label: 'Mach', toBase: v => v * 343, fromBase: v => v / 343 },
  { label: 'c', toBase: v => v * 299792458, fromBase: v => v / 299792458 },
]

function UnitTable({ units, title }: { units: Unit[]; title: string }) {
  const t = useTranslations('tools')
  const [val, setVal] = useState('')
  const [from, setFrom] = useState(units[0]?.label || '')
  const n = parseFloat(val)
  const uFrom = units.find(u => u.label === from)

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{title}</label>
            <input value={val} onChange={e => setVal(e.target.value)} maxLength={15} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-24">
            <label className="block text-xs text-text-secondary mb-1">{t('calcUnit')}</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary">
              {units.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
            </select>
          </div>
        </div>
        {!isNaN(n) && uFrom && (
          <div className="space-y-0.5">
            {units.filter(u => u.label !== from).map(u => (
              <div key={u.label} className="flex justify-between p-1.5 bg-card rounded-sm text-xs">
                <span className="text-text-secondary">{u.label}</span>
                <span className="text-text-primary font-mono">{fmt(u.fromBase(uFrom.toBase(n)))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Improved Temperature (all units inputtable) ─────
function TempCalc() {
  const t = useTranslations('tools')
  const [val, setVal] = useState('')
  const [unit, setUnit] = useState<'C' | 'F' | 'K'>('C')
  const n = parseFloat(val)
  const toC = (v: number, u: string) => {
    if (u === 'C') return v; if (u === 'F') return (v - 32) / 1.8; return v - 273.15
  }
  const c = isNaN(n) ? null : toC(n, unit)
  const f = c !== null ? c * 1.8 + 32 : null
  const k = c !== null ? c + 273.15 : null

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{t('calcTempValue')}</label>
            <input value={val} onChange={e => setVal(e.target.value)} maxLength={15} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-24">
            <label className="block text-xs text-text-secondary mb-1">{t('calcUnit')}</label>
            <select value={unit} onChange={e => setUnit(e.target.value as 'C' | 'F' | 'K')} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary">
              <option value="C">°C</option><option value="F">°F</option><option value="K">K</option>
            </select>
          </div>
        </div>
        {c !== null && (
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-card rounded-sm text-sm">
              <span className="text-text-secondary">°C ({t('calcCelsius')})</span>
              <span className="text-text-primary font-mono font-bold">{fmt(c)}</span>
            </div>
            <div className="flex justify-between p-2 bg-card rounded-sm text-sm">
              <span className="text-text-secondary">°F ({t('calcFahrenheit')})</span>
              <span className="text-text-primary font-mono font-bold">{fmt(f!)}</span>
            </div>
            <div className="flex justify-between p-2 bg-card rounded-sm text-sm">
              <span className="text-text-secondary">K ({t('calcKelvin')})</span>
              <span className="text-text-primary font-mono font-bold">{fmt(k!)}</span>
            </div>
            <div className="flex justify-between p-2 bg-card rounded-sm text-sm">
              <span className="text-text-secondary">°Ré ({t('calcReaumur')})</span>
              <span className="text-text-primary font-mono font-bold">{fmt(c * 0.8)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Improved BMI (age/gender reference) ─────────────
function BmiCalc() {
  const t = useTranslations('tools')
  const [h, setH] = useState('170')
  const [w, setW] = useState('70')
  const [age, setAge] = useState('30')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric')
  const height = parseFloat(h); const weight = parseFloat(w); const a = parseInt(age)
  const bmi = (isNaN(height) || isNaN(weight) || height <= 0) ? null
    : ((unit === 'metric' ? weight : weight * 0.453592) / ((unit === 'metric' ? height : height * 2.54) / 100) ** 2)

  // Age-adjusted BMI categories (simplified WHO standards)
  const cat = (() => {
    if (!bmi || isNaN(a)) return null
    if (a < 18) return bmi < 18.5 ? 'underweight' : bmi < 24 ? 'normal' : 'overweight'
    if (a < 40) return bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweightYoung' : 'obese'
    if (a < 60) return bmi < 19 ? 'underweight' : bmi < 26 ? 'normal' : bmi < 31 ? 'overweightYoung' : 'obese'
    return bmi < 20 ? 'underweight' : bmi < 27 ? 'normal' : bmi < 32 ? 'overweightYoung' : 'obese'
  })()

  const color = (() => {
    if (!bmi) return ''
    if (a < 18) return bmi < 18.5 ? 'bg-blue-400' : bmi < 24 ? 'bg-green-400' : 'bg-amber-400'
    if (a < 40) return bmi < 18.5 ? 'bg-blue-400' : bmi < 25 ? 'bg-green-400' : bmi < 30 ? 'bg-amber-400' : 'bg-red-400'
    if (a < 60) return bmi < 19 ? 'bg-blue-400' : bmi < 26 ? 'bg-green-400' : bmi < 31 ? 'bg-amber-400' : 'bg-red-400'
    return bmi < 20 ? 'bg-blue-400' : bmi < 27 ? 'bg-green-400' : bmi < 32 ? 'bg-amber-400' : 'bg-red-400'
  })()

  const healthyMin = unit === 'metric' ? (18.5 * (height / 100) ** 2).toFixed(0) : ''
  const healthyMax = unit === 'metric' ? (24.9 * (height / 100) ** 2).toFixed(0) : ''

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-1 mb-3">
          <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'metric' ? 'bg-accent text-white' : 'bg-card text-text-secondary'}`}>{t('calcMetric')}</button>
          <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'imperial' ? 'bg-accent text-white' : 'bg-card text-text-secondary'}`}>{t('calcImperial')}</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">{t('calcHeight')} ({unit === 'metric' ? 'cm' : 'in'})</label>
            <input value={h} onChange={e => setH(e.target.value)} maxLength={5} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">{t('calcWeight')} ({unit === 'metric' ? 'kg' : 'lb'})</label>
            <input value={w} onChange={e => setW(e.target.value)} maxLength={5} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">{t('calcAge')}</label>
            <input value={age} onChange={e => setAge(e.target.value)} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <button onClick={() => setGender('male')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'male' ? 'bg-accent text-white' : 'bg-card text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>{t('calcMale')}</button>
          <button onClick={() => setGender('female')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'female' ? 'bg-accent text-white' : 'bg-card text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>{t('calcFemale')}</button>
        </div>
        {bmi && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg`}>{bmi.toFixed(1)}</div>
              <div>
                <p className="text-sm font-medium text-text-primary">{cat ? t(`calc${cat.charAt(0).toUpperCase() + cat.slice(1)}`) : ''}</p>
                {unit === 'metric' && <p className="text-xs text-text-secondary">{t('calcHealthyWeightRange', { min: healthyMin, max: healthyMax })}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tax Calculator (月薪 + {t('calcTaxSocialInsurance')} + {t('calcTaxSpecialDeductions')} + {t('calcTaxBonus')}) ─
function TaxCalc() {
  const t = useTranslations('tools')
  const [salary, setSalary] = useState('15000')
  const [bonus, setBonus] = useState('')
  const [monthsWorked, setMonthsWorked] = useState('12')

  // {t('calcTaxSocialInsurance')} percentage inputs
  const [pensionPct, setPensionPct] = useState('8')
  const [medicalPct, setMedicalPct] = useState('2')
  const [unemploymentPct, setUnemploymentPct] = useState('0.5')
  const [housingFundPct, setHousingFundPct] = useState('8')

  // {t('calcTaxSpecialDeductions')} (monthly amounts)
  const [eduDed, setEduDed] = useState('')          // {t('calcTaxChildEdu')}
  const [contEdu, setContEdu] = useState('')        // {t('calcTaxContEdu')}
  const [medicalDed, setMedicalDed] = useState('')  // {t('calcTaxMedicalDed')}
  const [housingInt, setHousingInt] = useState('')  // calcTaxHousingInt
  const [housingRent, setHousingRent] = useState('') // {t('calcTaxHousingRent')}
  const [elderlyCare, setElderlyCare] = useState('') // {t('calcTaxElderlyCare')}
  const [infantCare, setInfantCare] = useState('')   // 3{t('calcTaxInfantCare')}
  const [showDeductions, setShowDeductions] = useState(false)

  const s = parseFloat(salary) || 0
  const b = parseFloat(bonus) || 0
  const mw = parseInt(monthsWorked) || 12
  const useMonthsWorked = !isNaN(parseInt(monthsWorked)) && parseInt(monthsWorked) > 0 && parseInt(monthsWorked) <= 12
  const actualMonths = useMonthsWorked ? mw : 12

  // {t('calcTaxSocialInsurance')} monthly amounts
  const pensionAmt = s * (parseFloat(pensionPct) || 0) / 100
  const medicalAmt = s * (parseFloat(medicalPct) || 0) / 100
  const unemploymentAmt = s * (parseFloat(unemploymentPct) || 0) / 100
  const housingFundAmt = s * (parseFloat(housingFundPct) || 0) / 100
  const socialInsurance = pensionAmt + medicalAmt + unemploymentAmt + housingFundAmt

  // {t('calcTaxSpecialDeductions')} monthly total
  const specialDedTotal = [
    eduDed, contEdu, medicalDed, housingInt, housingRent, elderlyCare, infantCare
  ].reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  // Yearly tax brackets
  const yearlyBrackets = [
    { low: 0, high: 36000, rate: 0.03, deduct: 0, label: 'calcTaxBracket1' },
    { low: 36000, high: 144000, rate: 0.1, deduct: 2520, label: 'calcTaxBracket2' },
    { low: 144000, high: 300000, rate: 0.2, deduct: 16920, label: 'calcTaxBracket3' },
    { low: 300000, high: 420000, rate: 0.25, deduct: 31920, label: 'calcTaxBracket4' },
    { low: 420000, high: 660000, rate: 0.3, deduct: 52920, label: 'calcTaxBracket5' },
    { low: 660000, high: 960000, rate: 0.35, deduct: 85920, label: 'calcTaxBracket6' },
    { low: 960000, high: Infinity, rate: 0.45, deduct: 181920, label: 'calcTaxBracket7' },
  ]

  const calcTax = (taxable: number, brackets: typeof yearlyBrackets) => {
    if (taxable <= 0) return null
    const bracket = brackets.find(b => taxable <= b.high) || brackets[brackets.length - 1]
    const tax = taxable * bracket.rate - bracket.deduct
    return { taxable, tax: Math.max(0, tax), rate: bracket.rate, bracket: bracket.label }
  }

  // Monthly taxable income = salary - 5000 threshold - {t('calcTaxSocialInsurance')} - {t('calcTaxSpecialDeductions')}
  const monthlyTaxable = s - 5000 - socialInsurance - specialDedTotal

  // Salary tax: annual income - annual deductions (always 12 months for deductions)
  const salaryResult = (() => {
    if (isNaN(parseFloat(salary))) return null
    const annualIncome = s * actualMonths
    const annualDeduction = 5000 * 12  // Standard deduction is always 12 months
    const annualSocialInsurance = socialInsurance * actualMonths
    const annualSpecialDed = specialDedTotal * actualMonths
    const annualTaxable = annualIncome - annualDeduction - annualSocialInsurance - annualSpecialDed
    return calcTax(annualTaxable, yearlyBrackets)
  })()

  // Bonus tax: bonus / 12 to find bracket, then bonus * rate - deduct
  const bonusResult = (() => {
    if (isNaN(b) || b <= 0) return null
    const monthly = b / 12
    // Use yearly brackets for bonus bracket lookup (same as Chinese tax law)
    const bracket = yearlyBrackets.find(b => monthly <= b.high) || yearlyBrackets[yearlyBrackets.length - 1]
    const tax = b * bracket.rate - bracket.deduct
    return { bonus: b, tax: Math.max(0, tax), rate: bracket.rate, bracket: bracket.label }
  })()

  const totalTax = (salaryResult?.tax || 0) + (bonusResult?.tax || 0)
  const totalIncome = s * actualMonths + b
  const afterTax = totalIncome - totalTax

  const inputClass = "w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary"
  const labelClass = "block text-xs text-text-secondary mb-1"

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface border border-border rounded-sm p-3 text-xs text-text-secondary leading-relaxed">
        {t('chinaOnlyNote')}
      </div>
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        {/* Basic salary inputs */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>{t('calcTaxMonthlySalary')}</label>
            <input value={salary} onChange={e => setSalary(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('calcTaxBonus')}</label>
            <input value={bonus} onChange={e => setBonus(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="mb-3">
          <label className={labelClass}>{t('calcTaxMonthsWorked')}</label>
          <input value={monthsWorked} onChange={e => setMonthsWorked(e.target.value)} placeholder="1-12" className={inputClass} />
        </div>

        {/* {t('calcTaxSocialInsurance')} */}
        <div className="mb-3">
          <p className="text-xs font-medium text-text-primary mb-2">{t('calcTaxSocialInsurance')}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('calcTaxPension')}</label>
              <input value={pensionPct} onChange={e => setPensionPct(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('calcTaxMedical')}</label>
              <input value={medicalPct} onChange={e => setMedicalPct(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('calcTaxUnemployment')}</label>
              <input value={unemploymentPct} onChange={e => setUnemploymentPct(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('calcTaxHousingFund')}</label>
              <input value={housingFundPct} onChange={e => setHousingFundPct(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* {t('calcTaxSpecialDeductions')} - collapsible */}
        <div className="mb-3">
          <button onClick={() => setShowDeductions(!showDeductions)}
            className="flex items-center gap-1 text-xs font-medium text-text-primary mb-2 w-full text-left">
            <span className="transition-transform duration-200" style={{ transform: showDeductions ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            {t('calcTaxSpecialDeductions')}
          </button>
          {showDeductions && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{t('calcTaxChildEdu')}</label>
                <input value={eduDed} onChange={e => setEduDed(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcTaxContEdu')}</label>
                <input value={contEdu} onChange={e => setContEdu(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcTaxMedicalDed')}</label>
                <input value={medicalDed} onChange={e => setMedicalDed(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcTaxHousingInt')}</label>
                <input value={housingInt} onChange={e => {
                  setHousingInt(e.target.value)
                  if (e.target.value) setHousingRent('')
                }} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcTaxHousingRent')}</label>
                <input value={housingRent} onChange={e => {
                  setHousingRent(e.target.value)
                  if (e.target.value) setHousingInt('')
                }} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcTaxElderlyCare')}</label>
                <input value={elderlyCare} onChange={e => setElderlyCare(e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>3{t('calcTaxInfantCare')}</label>
                <input value={infantCare} onChange={e => setInfantCare(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {s > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs p-1.5 bg-card rounded-sm">
              <span className="text-text-secondary">{t('calcTaxSocialInsuranceTotal')}</span>
              <span className="font-medium">¥{socialInsurance.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs p-1.5 bg-card rounded-sm">
              <span className="text-text-secondary">{t('calcTaxSpecialDedTotal')}</span>
              <span className="font-medium">¥{specialDedTotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs p-1.5 bg-card rounded-sm">
              <span className="text-text-secondary">{t('calcTaxMonthlyTaxable')}</span>
              <span className="font-medium">¥{Math.max(0, monthlyTaxable).toFixed(0)}</span>
            </div>
          </div>
        )}

        {s > 0 && (
          <div className="mt-3 space-y-2">
            {salaryResult && (
              <>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxAnnualTaxable')}</span>
                  <span className="font-medium">¥{salaryResult.taxable.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxSalaryRate')}</span>
                  <span className="font-medium">{(salaryResult.rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxSalaryTax')}</span>
                  <span className="font-medium">¥{salaryResult.tax.toFixed(0)}</span>
                </div>
              </>
            )}
            {bonusResult && (
              <>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxBonus')} (÷12 = ¥{(bonusResult.bonus / 12).toFixed(0)})</span>
                  <span className="font-medium">{t(bonusResult.bracket)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxBonusRate')}</span>
                  <span className="font-medium">{(bonusResult.rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-card rounded-sm">
                  <span className="text-text-secondary">{t('calcTaxBonusTax')}</span>
                  <span className="font-medium">¥{bonusResult.tax.toFixed(0)}</span>
                </div>
              </>
            )}
            {(salaryResult || bonusResult) && (
              <div className="flex justify-between text-sm p-2 bg-card rounded-sm border-t border-[rgba(127,99,21,0.1)]">
                <span className="text-text-secondary font-medium">{t('calcTaxTotal')}</span>
                <span className="text-accent font-bold">¥{totalTax.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm p-2 bg-green-50 rounded-sm border border-green-200">
              <span className="text-green-700">{t('calcTaxAfterTax')}</span>
              <span className="text-green-700 font-bold">¥{afterTax.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
      {(salaryResult || bonusResult) && (
        <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-3">
          <p className="text-xs text-text-secondary/60 mb-2">{t('calcTaxBracketReference')}</p>
          <div className="space-y-0.5">
            {yearlyBrackets.map(b => (
              <div key={b.low} className={`flex justify-between text-xs p-1.5 rounded-sm ${b.label === salaryResult?.bracket ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary'}`}>
                <span>{t(b.label)}</span>
                <span>{(b.rate * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mortgage Calculator (商业/公积金/组合 + LPR+BP + 下拉选择) ─
function MortgageCalc() {
  const t = useTranslations('tools')
  const [type, setType] = useState<'commercial' | 'fund' | 'mixed'>('commercial')
  const [repayType, setRepayType] = useState<'equal-payment' | 'equal-principal'>('equal-payment')
  const [loanAmount, setLoanAmount] = useState('100')
  const [commercialAmount, setCommercialAmount] = useState('200')
  const [fundAmount, setFundAmount] = useState('100')
  const [lpr, setLpr] = useState('3.5')
  const [bp, setBp] = useState('0')
  const [fundRate, setFundRate] = useState('3.15')
  const [commercialYears, setCommercialYears] = useState('30')
  const [fundYears, setFundYears] = useState('25')
  const [startYear, setStartYear] = useState('2026')
  const [startMonth, setStartMonth] = useState('01')
  const [startDay, setStartDay] = useState('01')
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({})

  const startDate = `${startYear}-${startMonth}-${startDay}`
  const daysInMonth = new Date(parseInt(startYear), parseInt(startMonth), 0).getDate()
  // Clamp day when month changes
  useEffect(() => {
    const max = new Date(parseInt(startYear), parseInt(startMonth), 0).getDate()
    if (parseInt(startDay) > max) setStartDay(String(max).padStart(2, '0'))
  }, [startYear, startMonth])

  const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => String(i + 1))

  const calcEqualPayment = (principal: number, monthlyRate: number, months: number) => {
    if (monthlyRate <= 0 || months <= 0) return { monthly: 0, totalInterest: 0, totalPayment: 0, schedule: [] }
    const monthly = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    const totalPayment = monthly * months
    const totalInterest = totalPayment - principal
    const schedule: { month: number; payment: number; principal: number; interest: number; remaining: number }[] = []
    let remaining = principal
    for (let i = 1; i <= months; i++) {
      const interest = remaining * monthlyRate
      const principalPaid = monthly - interest
      remaining -= principalPaid
      schedule.push({ month: i, payment: monthly, principal: principalPaid, interest, remaining: Math.max(0, remaining) })
    }
    return { monthly, totalInterest, totalPayment, schedule }
  }

  const calcEqualPrincipal = (principal: number, monthlyRate: number, months: number) => {
    if (monthlyRate <= 0 || months <= 0) return { monthly: 0, totalInterest: 0, totalPayment: 0, schedule: [] }
    const monthlyPrincipal = principal / months
    let totalPayment = 0
    let totalInterest = 0
    const schedule: { month: number; payment: number; principal: number; interest: number; remaining: number }[] = []
    let remaining = principal
    for (let i = 1; i <= months; i++) {
      const interest = remaining * monthlyRate
      const payment = monthlyPrincipal + interest
      remaining -= monthlyPrincipal
      totalPayment += payment
      totalInterest += interest
      schedule.push({ month: i, payment, principal: monthlyPrincipal, interest, remaining: Math.max(0, remaining) })
    }
    return { monthly: schedule[0]?.payment || 0, totalInterest, totalPayment, schedule }
  }

  const commercialN = parseInt(commercialYears) * 12
  const fundN = parseInt(fundYears) * 12
  const commercialRate = (parseFloat(lpr) + parseFloat(bp || '0') / 100) / 100 / 12
  const fundMonthlyRate = (parseFloat(fundRate) || 0) / 100 / 12

  const result = (() => {
    const calc = repayType === 'equal-payment' ? calcEqualPayment : calcEqualPrincipal

    if (type === 'commercial') {
      const principal = (parseFloat(loanAmount) || 0) * 10000
      if (principal <= 0 || commercialN <= 0) return null
      return calc(principal, commercialRate, commercialN)
    }

    if (type === 'fund') {
      const principal = (parseFloat(loanAmount) || 0) * 10000
      if (principal <= 0 || fundN <= 0) return null
      return calc(principal, fundMonthlyRate, fundN)
    }

    // Mixed
    const ca = (parseFloat(commercialAmount) || 0) * 10000
    const fa = (parseFloat(fundAmount) || 0) * 10000
    if (ca + fa <= 0) return null
    const comResult = calc(ca, commercialRate, commercialN)
    const fundResult = calc(fa, fundMonthlyRate, fundN)
    return {
      monthly: comResult.monthly + fundResult.monthly,
      totalInterest: comResult.totalInterest + fundResult.totalInterest,
      totalPayment: comResult.totalPayment + fundResult.totalPayment,
      schedule: [],
      commercial: { monthly: comResult.monthly, amount: ca, schedule: comResult.schedule },
      fund: { monthly: fundResult.monthly, amount: fa, schedule: fundResult.schedule },
    }
  })()

  const formatDate = (d: string) => {
    if (!d) return ''
    const date = new Date(d)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${y}${t('calcYearSuffix')}${m}${t('calcMonthSuffix')}${day}${t('calcDaySuffix')}`
  }

  const effectiveRate = type === 'commercial'
    ? (parseFloat(lpr) + parseFloat(bp || '0') / 100)
    : type === 'fund' ? parseFloat(fundRate) : ''

  const btnClass = (active: boolean) =>
    `px-3 py-1 text-xs rounded-sm ${active ? 'bg-accent text-white' : 'bg-card text-text-secondary'}`
  const inputClass = "w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary"
  const labelClass = "block text-xs text-text-secondary mb-1"

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface border border-border rounded-sm p-3 text-xs text-text-secondary leading-relaxed">
        {t('chinaOnlyNote')}
      </div>
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        {/* Loan type */}
        <div className="flex gap-1 mb-3 flex-wrap">
          <button onClick={() => setType('commercial')} className={btnClass(type === 'commercial')}>{t('calcMortgageCommercial')}</button>
          <button onClick={() => setType('fund')} className={btnClass(type === 'fund')}>{t('calcMortgageFund')}</button>
          <button onClick={() => setType('mixed')} className={btnClass(type === 'mixed')}>{t('calcMortgageMixed')}</button>
        </div>

        {/* Repay type dropdown */}
        <div className="mb-3">
          <label className={labelClass}>{t('calcMortgageRepayMethod')}</label>
          <select value={repayType} onChange={e => setRepayType(e.target.value as 'equal-payment' | 'equal-principal')} className={inputClass}>
            <option value="equal-payment">{t('calcMortgageEqualPayment')}</option>
            <option value="equal-principal">{t('calcMortgageEqualPrincipal')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Loan amount */}
          {type !== 'mixed' ? (
            <div className="col-span-2">
              <label className={labelClass}>{t('calcMortgageAmount')}</label>
              <input value={loanAmount} onChange={e => setLoanAmount(e.target.value)} maxLength={6} className={inputClass} />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>{t('calcMortgageAmountShort')}</label>
                <input value={commercialAmount} onChange={e => setCommercialAmount(e.target.value)} maxLength={6} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcMortgageAmountShort')}</label>
                <input value={fundAmount} onChange={e => setFundAmount(e.target.value)} maxLength={6} className={inputClass} />
              </div>
            </>
          )}

          {/* Years dropdowns */}
          {type !== 'mixed' ? (
            <div className="col-span-2">
              <label className={labelClass}>{t('calcMortgageYears')}</label>
              <select value={type === 'commercial' ? commercialYears : fundYears} onChange={e => {
                if (type === 'commercial') setCommercialYears(e.target.value)
                else setFundYears(e.target.value)
              }} className={inputClass}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{t('calcYear', { y })}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>{t('calcMortgageCommercialYears')}</label>
                <select value={commercialYears} onChange={e => setCommercialYears(e.target.value)} className={inputClass}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{t('calcYear', { y })}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('calcMortgageFundYears')}</label>
                <select value={fundYears} onChange={e => setFundYears(e.target.value)} className={inputClass}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{t('calcYear', { y })}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Rate - LPR + BP for commercial */}
          {type !== 'fund' && (
            <>
              <div>
                <label className={labelClass}>{t('calcMortgageLPR')}</label>
                <input value={lpr} onChange={e => setLpr(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('calcMortgageBP')}</label>
                <input value={bp} onChange={e => setBp(e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* Fund rate */}
          {type !== 'commercial' && (
            <div>
              <label className={labelClass}>{t('calcMortgageFundRate')}</label>
              <input value={fundRate} onChange={e => setFundRate(e.target.value)} className={inputClass} />
            </div>
          )}

          {/* Start date - dropdowns */}
          <div className="col-span-2">
            <label className={labelClass}>{t('calcMortgageFirstPayment')}</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={startYear} onChange={e => setStartYear(e.target.value)} className={inputClass}>
                {Array.from({ length: 30 }, (_, i) => String(2025 + i)).map(y => <option key={y} value={y}>{t('calcYear', { y })}</option>)}
              </select>
              <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className={inputClass}>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{t('calcMonth', { m })}</option>)}
              </select>
              <select value={startDay} onChange={e => setStartDay(e.target.value)} className={inputClass}>
                {Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{t('calcDay', { d })}</option>)}
              </select>
            </div>
          </div>
        </div>

        {result && result.monthly > 0 && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)] space-y-2">
            {startDate && (
              <p className="text-xs text-text-secondary/60">{t('calcMortgageFirstPaymentDate', { date: formatDate(startDate) })}</p>
            )}
            {effectiveRate !== '' && (
              <p className="text-xs text-text-secondary/60">
                {type === 'commercial' ? t('calcMortgageRateInfo', { sign: parseFloat(bp || '0') >= 0 ? '+' : '', bp, rate: effectiveRate })
                  : type === 'fund' ? `${t('calcMortgageFundRate')}: ${effectiveRate}%`
                  : ''}
              </p>
            )}
            <div className="flex justify-between items-center p-2 bg-card rounded-sm">
              <span className="text-text-secondary text-sm">{t('calcMortgageMonthlyPayment')}</span>
              <span className="text-accent font-bold text-lg">¥{result.monthly.toFixed(0)}</span>
            </div>
            {repayType === 'equal-principal' && result.schedule && result.schedule.length > 1 && (
              <p className="text-xs text-text-secondary/60 text-right">
                {t('calcMortgageFirstMonthDesc', { amount: result.schedule[0].payment - result.schedule[1].payment })}
              </p>
            )}
            {type === 'mixed' && 'commercial' in result && 'fund' in result && (
              <div className="p-2 bg-card rounded-sm text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('calcMortgageCommercial')}</span>
                  <span className="font-medium">{t('calcMortgageDetail', { amount: (result as any).commercial.amount.toFixed(0), monthly: (result as any).commercial.monthly.toFixed(0) })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('calcMortgageFund')}</span>
                  <span className="font-medium">{t('calcMortgageDetail', { amount: (result as any).fund.amount.toFixed(0), monthly: (result as any).fund.monthly.toFixed(0) })}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-card rounded-sm text-center">
                <p className="text-xs text-text-secondary">{t('calcMortgageTotalInterest')}</p>
                <p className="text-sm font-medium">¥{result.totalInterest.toFixed(0)}</p>
              </div>
              <div className="p-2 bg-card rounded-sm text-center">
                <p className="text-xs text-text-secondary">{t('calcMortgageTotalPayment')}</p>
                <p className="text-sm font-medium">¥{result.totalPayment.toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}
        {result && result.schedule && result.schedule.length > 0 && (
          <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-primary">{t('calcMortgageSchedule')}</p>
              <span className="text-xs text-text-secondary/60">{t('calcMortgagePeriods', { count: result.schedule.length })}</span>
            </div>
            {Array.from({ length: Math.ceil(result.schedule.length / 12) }, (_, yi) => {
              const year = yi + 1
              const isExpanded = expandedYears[year]
              const yearMonths = result.schedule.slice(yi * 12, (yi + 1) * 12)
              const yearTotal = yearMonths.reduce((s, m) => s + m.payment, 0)
              return (
                <div key={year} className="mb-1">
                  <button
                    onClick={() => setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                    className="w-full flex items-center justify-between p-2 bg-card rounded-sm text-xs hover:bg-accent/5 transition-colors"
                  >
                    <span className="font-medium text-text-primary">{t('calcYearN', { year })}</span>
                    <span className="text-text-secondary">
                      {t('calcYearRepayment', { amount: yearTotal.toFixed(0) })} {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-0.5 ml-2">
                      <div className="flex items-center text-[10px] text-text-secondary/60 px-2 py-1">
                        <span className="w-8">{t('calcMortgagePeriod')}</span>
                        <span className="w-20 text-right">{t('calcMortgageMonthlyPayment')}</span>
                        <span className="w-20 text-right">{t('calcMortgagePrincipal')}</span>
                        <span className="w-20 text-right">{t('calcMortgageInterest')}</span>
                        <span className="w-20 text-right">{t('calcMortgageRemaining')}</span>
                      </div>
                      {yearMonths.map(m => (
                        <div key={m.month} className="flex items-center text-[11px] px-2 py-1 bg-card rounded-sm">
                          <span className="w-8 text-text-secondary">{m.month}</span>
                          <span className="w-20 text-right text-text-primary font-mono">¥{m.payment.toFixed(0)}</span>
                          <span className="w-20 text-right text-text-secondary font-mono">¥{m.principal.toFixed(0)}</span>
                          <span className="w-20 text-right text-text-secondary font-mono">¥{m.interest.toFixed(0)}</span>
                          <span className="w-20 text-right text-text-secondary/60 font-mono">¥{m.remaining.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {type === 'mixed' && result && 'commercial' in result && 'fund' in result && (
          <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
            <p className="text-xs font-medium text-text-primary mb-2">{t('calcMortgageSchedule')}</p>
            {[t('calcMortgageCommercial'), t('calcMortgageFund')].map((label, idx) => {
              const part = idx === 0 ? (result as any).commercial : (result as any).fund
              const schedule = part.schedule || []
              if (schedule.length === 0) return null
              return (
                <div key={label} className="mb-2">
                  <p className="text-xs text-text-secondary/60 mb-1">{label}</p>
                  {Array.from({ length: Math.ceil(schedule.length / 12) }, (_, yi) => {
                    const year = yi + 1
                    const key = `${label}-${year}`
                    const isExpanded = expandedYears[key as any]
                    const yearMonths = schedule.slice(yi * 12, (yi + 1) * 12)
                    const yearTotal = yearMonths.reduce((s: number, m: any) => s + m.payment, 0)
                    return (
                      <div key={year} className="mb-1">
                        <button
                          onClick={() => setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="w-full flex items-center justify-between p-2 bg-card rounded-sm text-xs hover:bg-accent/5 transition-colors"
                        >
                          <span className="font-medium text-text-primary">{t('calcYearN', { year })}</span>
                          <span className="text-text-secondary">
                            {t('calcYearRepayment', { amount: yearTotal.toFixed(0) })} {isExpanded ? '▲' : '▼'}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="mt-1 space-y-0.5 ml-2">
                            <div className="flex items-center text-[10px] text-text-secondary/60 px-2 py-1">
                              <span className="w-8">{t('calcMortgagePeriod')}</span>
                              <span className="w-20 text-right">{t('calcMortgageMonthlyPayment')}</span>
                              <span className="w-20 text-right">{t('calcMortgagePrincipal')}</span>
                              <span className="w-20 text-right">{t('calcMortgageInterest')}</span>
                              <span className="w-20 text-right">{t('calcMortgageRemaining')}</span>
                            </div>
                            {yearMonths.map((m: any) => (
                              <div key={m.month} className="flex items-center text-[11px] px-2 py-1 bg-card rounded-sm">
                                <span className="w-8 text-text-secondary">{m.month}</span>
                                <span className="w-20 text-right text-text-primary font-mono">¥{m.payment.toFixed(0)}</span>
                                <span className="w-20 text-right text-text-secondary font-mono">¥{m.principal.toFixed(0)}</span>
                                <span className="w-20 text-right text-text-secondary font-mono">¥{m.interest.toFixed(0)}</span>
                                <span className="w-20 text-right text-text-secondary/60 font-mono">¥{m.remaining.toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chinese Uppercase Number + Roman Numeral ─────────
function ChineseNumCalc() {
  const t = useTranslations('tools')
  const [mode, setMode] = useState('chinese')
  const [num, setNum] = useState('1234567890')
  const n = parseFloat(num)
  const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const UNITS = ['', '拾', '佰', '仟']
  const BIG = ['', '万', '亿']

  const chineseResult = (() => {
    if (isNaN(n)) return null
    if (num.replace('.', '').length > 15) return '数字过大'
    const parts = n.toFixed(2).split('.')
    let int = parseInt(parts[0])
    const dec = parseInt(parts[1])
    if (int === 0 && dec === 0) return '零元整'
    let s = ''
    if (int > 0) {
      let i = 0
      while (int > 0) {
        let seg = int % 10000
        let segStr = ''
        for (let j = 0; j < 4; j++) {
          const d = seg % 10
          if (d !== 0) segStr = DIGITS[d] + UNITS[j] + segStr
          else if (segStr && !segStr.startsWith('零')) segStr = '零' + segStr
          seg = Math.floor(seg / 10)
        }
        if (segStr.endsWith('零')) segStr = segStr.slice(0, -1)
        if (segStr.startsWith('零')) segStr = segStr.slice(1)
        if (segStr) s = segStr + BIG[i] + s
        else if (s) s = '零' + s
        int = Math.floor(int / 10000); i++
      }
      s += '元'
    }
    if (dec === 0) s += '整'
    else {
      if (dec >= 10) s += DIGITS[Math.floor(dec / 10)] + '角'
      if (dec % 10 !== 0) s += DIGITS[dec % 10] + '分'
    }
    return s
  })()

  const romanResult = (() => {
    if (isNaN(n) || n <= 0 || n >= 4000) return null
    const vals: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    let remaining = Math.floor(n)
    let r = ''
    for (const [val, sym] of vals) {
      while (remaining >= val) { r += sym; remaining -= val }
    }
    return r
  })()

  const result = mode === 'chinese' ? chineseResult : romanResult

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface border border-border rounded-sm p-3 text-xs text-text-secondary leading-relaxed">
        {t('calcChineseNote')}
      </div>
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-1 mb-3">
          <button onClick={() => setMode('chinese')} className={`px-3 py-1.5 text-xs rounded-sm ${mode === 'chinese' ? 'bg-accent text-white' : 'bg-card text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>{t('calcChineseMode')}</button>
          <button onClick={() => setMode('roman')} className={`px-3 py-1.5 text-xs rounded-sm ${mode === 'roman' ? 'bg-accent text-white' : 'bg-card text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>{t('calcRomanMode')}</button>
        </div>
        <label className="block text-xs text-text-secondary mb-1">{t('calcInputNumber')}</label>
        <input value={num} onChange={e => setNum(e.target.value)} placeholder="12345.67" className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
        {result && (
          <div className="mt-3 p-3 bg-card rounded-sm border border-[rgba(127,99,21,0.08)]">
            <p className="text-xs text-text-secondary/60 mb-1">{t('calcResult')}</p>
            <p className="text-lg font-bold text-accent break-all">{result}</p>
          </div>
        )}
        {mode === 'roman' && n >= 4000 && <p className="text-error text-xs mt-2">{t('calcRomanLimit')}</p>}
      </div>
    </div>
  )
}

// ─── Time Converter (fixed display order, formatNumber) ──
function formatNumber(n: number): string {
  // If integer, add thousands separator
  if (Number.isInteger(n)) {
    return n.toLocaleString('en-US')
  }
  // Otherwise show up to 6 decimal places, strip trailing zeros
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
}

// Strip trailing zeros from decimal string
function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 10 })
}

function TimeCalc() {
  const t = useTranslations('tools')
  const [val, setVal] = useState('')
  const [from, setFrom] = useState('years')
  const n = parseFloat(val)

  // 1 year = 365 days, 1 month = 365/12 days
  const SECONDS_PER_YEAR = 31536000  // 365 days
  const SECONDS_PER_MONTH = 2592000   // 30 days
  const SECONDS_PER_WEEK = 604800     // 7 days
  const SECONDS_PER_DAY = 86400
  const SECONDS_PER_HOUR = 3600
  const SECONDS_PER_MINUTE = 60

  const toSeconds = (v: number, u: string) => {
    switch (u) {
      case 'seconds': return v
      case 'minutes': return v * SECONDS_PER_MINUTE
      case 'hours': return v * SECONDS_PER_HOUR
      case 'days': return v * SECONDS_PER_DAY
      case 'weeks': return v * SECONDS_PER_WEEK
      case 'months': return v * SECONDS_PER_MONTH
      case 'quarters': return v * 91 * SECONDS_PER_DAY
      case 'years': return v * SECONDS_PER_YEAR
      default: return v
    }
  }

  const toUnit = (v: number, u: string) => {
    switch (u) {
      case 'seconds': return v
      case 'minutes': return v / SECONDS_PER_MINUTE
      case 'hours': return v / SECONDS_PER_HOUR
      case 'days': return v / SECONDS_PER_DAY
      case 'weeks': return v / SECONDS_PER_WEEK
      case 'months': return v / SECONDS_PER_MONTH
      case 'quarters': return v / 91 / SECONDS_PER_DAY
      case 'years': return v / SECONDS_PER_YEAR
      default: return v
    }
  }

  // Fixed display order: 年, 月, 周, 天, 时, 分, 秒
  const units = [
    { label: 'years', labelZh: t('calcYears') },
    { label: 'quarters', labelZh: t('calcQuarters') },
    { label: 'months', labelZh: t('calcMonths') },
    { label: 'weeks', labelZh: t('calcWeeks') },
    { label: 'days', labelZh: t('calcDays') },
    { label: 'hours', labelZh: t('calcHours') },
    { label: 'minutes', labelZh: t('calcMinutes') },
    { label: 'seconds', labelZh: t('calcSeconds') },
  ]

  const convertUnit = (value: number, fromUnit: string, targetUnit: string) => {
    // Direct conversions between years, months, quarters (no seconds)
    if (fromUnit === 'years' && targetUnit === 'months') return value * 12
    if (fromUnit === 'months' && targetUnit === 'years') return value / 12
    if (fromUnit === 'years' && targetUnit === 'quarters') return value * 4
    if (fromUnit === 'quarters' && targetUnit === 'years') return value / 4
    if (fromUnit === 'months' && targetUnit === 'quarters') return value / 3
    if (fromUnit === 'quarters' && targetUnit === 'months') return value * 3
    // All other conversions: go through seconds
    return toUnit(toSeconds(value, fromUnit), targetUnit)
  }

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="bg-surface border border-border rounded-sm p-3 text-xs space-y-1">
          <div className="flex items-center justify-between text-text-primary">
            <span className="font-medium">{t('calcConversionRules')}</span>
          </div>
          <div className="text-text-secondary/80">{t('timeDesc')}</div>
        </div>
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{t('calcTimeConvert')}</label>
            <input value={val} onChange={e => setVal(e.target.value)} maxLength={15} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-text-secondary mb-1">{t('calcUnit')}</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-card border border-border rounded-sm text-sm text-text-primary">
              {units.map(u => <option key={u.label} value={u.label}>{u.labelZh}</option>)}
            </select>
          </div>
        </div>
        {!isNaN(n) && (
          <div className="space-y-0.5">
            {units.filter(u => u.label !== from).map(u => (
              <div key={u.label} className="flex justify-between p-1.5 bg-card rounded-sm text-xs">
                <span className="text-text-secondary">{u.labelZh}</span>
                <span className="text-text-primary font-mono">{formatNumber(convertUnit(n, from, u.label))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chinese Family Relationship Calculator ──────────
function TitleCalc() {
  const t = useTranslations('tools')
  const relations = familyRelations

  const malePeople = ['爸爸', '哥哥', '弟弟', '爷爷', '外公', '儿子', '孙子', '伯父', '叔叔', '舅舅', '伯祖父', '叔祖父', '姑父', '姨父', '舅公']
  const femalePeople = ['妈妈', '姐姐', '妹妹', '奶奶', '外婆', '女儿', '孙女', '姑姑', '姨妈', '伯母', '婶婶', '舅妈', '姑奶奶', '姨奶奶', '姨祖母']

  const row1 = ['爸爸', '妈妈', '哥哥', '姐姐', '弟弟', '妹妹', '爷爷', '奶奶', '外公', '外婆']
  const row3 = ['爸爸', '妈妈', '哥哥', '姐姐', '弟弟', '妹妹', '老公', '老婆', '儿子', '女儿']

  const [selected1, setSelected1] = useState('')
  const [selected3, setSelected3] = useState('')

  // Only block same-gender spouse: 男性+老公 or 女性+老婆
  const isInvalid = selected1 && selected3 && (
    (malePeople.includes(selected1) && selected3 === '老公') ||
    (femalePeople.includes(selected1) && selected3 === '老婆')
  )

  const key = selected1 && selected3 ? `${selected1}的${selected3}` : ''
  const result = key
    ? isInvalid
      ? t('calcTitleInvalid')
      : relations[key] || `${key}（${t('calcTitleNotFound')}）`
    : ''

  const clear = () => { setSelected1(''); setSelected3('') }
  const back = () => {
    if (selected3) setSelected3('')
    else if (selected1) setSelected1('')
  }

  // Most common 15 relations for quick reference (3 columns × 5 rows)
  const commonRelations = [
    '爸爸的爸爸', '爸爸的妈妈', '妈妈的爸爸',
    '妈妈的妈妈', '爸爸的哥哥', '爸爸的弟弟',
    '爸爸的姐妹', '妈妈的哥哥', '妈妈的弟弟',
    '妈妈的姐妹', '哥哥的老婆', '弟弟的老婆',
    '姐姐的老公', '妹妹的老公', '爷爷的爸爸',
  ]

  const btnClass = (selected: boolean) =>
    `px-2.5 py-1.5 text-xs rounded-sm transition-colors ${
      selected ? 'bg-accent text-white' : 'bg-card text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30'
    }`

  return (
      <div className="max-w-lg mx-auto space-y-3">
        <div className="bg-surface border border-border rounded-sm p-3 text-xs text-text-secondary leading-relaxed space-y-1">
          {t('calcTitleNote')}
          <p>{t('chinaOnlyNote')}</p>
        </div>
        <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
          <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-text-secondary/60">{t('calcTitleSelectRelation')}</p>
                  </div>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-5 gap-1.5 flex-1">
              {row1.map(name => (
                <button key={name} onClick={() => setSelected1(selected1 === name ? '' : name)}
                  className={btnClass(selected1 === name)}>{name}</button>
              ))}
            </div>
            <div className="shrink-0">
              <span className="text-base text-text-secondary font-medium">的</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 flex-1">
              {row3.map(name => (
                <button key={name} onClick={() => setSelected3(selected3 === name ? '' : name)}
                  className={btnClass(selected3 === name)}>{name}</button>
              ))}
            </div>
          </div>
        {selected1 && selected3 && (
          <div className={`mt-3 p-3 bg-card rounded-sm border text-center ${
            isInvalid ? 'border-red-300' : 'border-[rgba(127,99,21,0.08)]'
          }`}>
            <p className="text-xs text-text-secondary/60 mb-1">{selected1}的{selected3}</p>
            <p className={`text-lg font-medium ${
              isInvalid ? 'text-error' : 'text-text-primary'
            }`}>{result}</p>
          </div>
        )}
      </div>
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-3">
        <p className="text-xs text-text-secondary/60 mb-2">{t('calcTitleCommonRelations')}</p>
        <div className="grid grid-cols-3 gap-1">
          {commonRelations.map(k => {
            const parts = k.split('的')
            return (
              <button key={k} onClick={() => {
                if (parts.length === 2) {
                  setSelected1(parts[0])
                  setSelected3(parts[1])
                } else if (parts.length === 3) {
                  setSelected1(`${parts[0]}的${parts[1]}`)
                  setSelected3(parts[2])
                }
              }}
                className="text-left text-xs p-1.5 bg-card rounded-sm hover:bg-accent/5 text-text-primary">
                {k} → {relations[k]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Number Base Converter (auto-convert, validated) ──
function BaseCalc() {
  const t = useTranslations('tools')
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)
  const BASES = [
    { base: 2, label: 'BIN' }, { base: 8, label: 'OCT' },
    { base: 10, label: 'DEC' }, { base: 16, label: 'HEX' },
  ]

  // Valid character patterns per base
  const validPatterns: Record<number, RegExp> = {
    2: /^[01]+$/i,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-f]+$/i,
  }

  const validChars: Record<number, string> = {
    2: '0, 1',
    8: '0-7',
    10: '0-9',
    16: '0-9, A-F',
  }

  const baseNames: Record<number, string> = { 2: 'calcBaseBinary', 8: 'calcBaseOctal', 10: 'calcBaseDecimal', 16: 'calcBaseHex' }
  const error = input.trim() && !validPatterns[fromBase].test(input.trim())
    ? t('calcBaseError', { base: t(baseNames[fromBase]), chars: validChars[fromBase] })
    : ''

  const decimal = input.trim() && !error ? parseInt(input.trim(), fromBase) : NaN
  const results = error || isNaN(decimal) ? [] : BASES.map(({ base, label }) => ({
    base, label,
    labelFull: `${label} (${t(`base${base}`)})`,
    value: decimal.toString(base).toUpperCase(),
  }))

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="bg-surface border border-border rounded-sm p-3 text-xs text-text-secondary leading-relaxed">
        {t('baseDesc')}
      </div>
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-5">
        <div className="flex gap-2 mb-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="{t('calcInputNumber')}"
            className="flex-1 p-3 bg-card border border-border rounded-sm text-sm font-mono text-text-primary focus:outline-none focus:border-accent/30" />
          <select value={fromBase} onChange={e => { setInput(''); setFromBase(parseInt(e.target.value)) }}
            className="p-3 bg-card border border-border rounded-sm text-sm text-text-primary focus:outline-none">
            {BASES.map(b => <option key={b.base} value={b.base}>{b.label} ({t(`base${b.base}`)})</option>)}
          </select>
        </div>
        {error && <p className="text-error text-xs mb-2">{error}</p>}
        {results.length > 0 && (
          <div className="space-y-1.5">
            {results.map(r => (
              <div key={r.base} className="flex items-center gap-3 p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.08)]">
                <span className="w-36 text-accent font-mono text-xs font-bold shrink-0">{r.labelFull}</span>
                <code className="flex-1 font-mono text-sm text-text-primary break-all overflow-x-auto">{r.value}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}