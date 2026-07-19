'use client'

import { useState, useEffect } from 'react'

// ─── Helpers ─────────────────────────────────────────
function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b; case '-': return a - b
    case '*': return a * b; case '/': return b !== 0 ? a / b : NaN
    default: return b
  }
}

const RATES: Record<string, number> = {
  USD: 1, CNY: 7.24, EUR: 0.92, JPY: 149.5, GBP: 0.79, KRW: 1320, HKD: 7.82, TWD: 32.1, SGD: 1.34, AUD: 1.53,
}

const btn = (label: string, base: string, onClick: () => void) => (
  <button key={label} onClick={onClick} className={`p-3 text-sm rounded-sm font-medium transition-colors active:scale-90 duration-100 ${base}`}>{label}</button>
)

// ─── Main Calculator ─────────────────────────────────
type Tab = 'calc' | 'currency' | 'length' | 'weight' | 'area' | 'volume' | 'temp' | 'speed' | 'bmi' | 'tax' | 'mortgage' | 'chinese' | 'time' | 'title' | 'base'

const TABS: { id: Tab; label: string }[] = [
  { id: 'calc', label: '计算器' },
  { id: 'currency', label: '汇率' },
  { id: 'length', label: '长度' },
  { id: 'weight', label: '重量' },
  { id: 'area', label: '面积' },
  { id: 'volume', label: '体积' },
  { id: 'temp', label: '温度' },
  { id: 'speed', label: '速度' },
  { id: 'bmi', label: 'BMI' },
  { id: 'tax', label: '个税' },
  { id: 'mortgage', label: '房贷' },
  { id: 'chinese', label: '大写' },
  { id: 'time', label: '时间' },
  { id: 'title', label: '称呼' },
  { id: 'base', label: '进制' },
]

export default function Calculator() {
  const [tab, setTab] = useState<Tab>('calc')

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[rgba(127,99,21,0.15)]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-t-sm whitespace-nowrap transition-colors shrink-0 ${
              tab === t.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}>{t.label}</button>
        ))}
      </div>
      {tab === 'calc' && <CalcPanel />}
      {tab === 'currency' && <CurrencyCalc />}
      {tab === 'length' && <UnitCalc title="长度转换" units={LENGTH} />}
      {tab === 'weight' && <UnitCalc title="重量转换" units={WEIGHT} />}
      {tab === 'area' && <UnitCalc title="面积转换" units={AREA} />}
      {tab === 'volume' && <UnitCalc title="体积转换" units={VOLUME} />}
      {tab === 'temp' && <TempCalc />}
      {tab === 'speed' && <UnitCalc title="速度转换" units={SPEED} />}
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

// ─── Calculator Panel (Basic + Scientific) ───────────
function CalcPanel() {
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
      const r = compute(prev, cur, op)
      setExpr(`${prev} ${op} ${cur} =`); setDisplay(String(r)); setPrev(r)
    } else {
      setExpr(cur + ' ' + next); setPrev(cur)
    }
    setOp(next); setReset(true)
  }

  const equals = () => {
    if (prev === null || !op) return
    const cur = parseFloat(display)
    const r = compute(prev, cur, op)
    setExpr(`${prev} ${op} ${cur} =`); setDisplay(String(r))
    setPrev(null); setOp(null); setReset(true)
  }

  const clear = () => { setDisplay('0'); setExpr(''); setPrev(null); setOp(null); setReset(false) }

  const apply = (fn: (x: number) => number, name: string) => {
    const v = parseFloat(display)
    if (isNaN(v)) return
    setExpr(`${name}(${v}) =`); setDisplay(String(fn(v)))
  }

  const toRad = (x: number) => rad ? x : x * Math.PI / 180

  const funcs = [
    { l: 'sin', f: (x: number) => Math.sin(toRad(x)) },
    { l: 'cos', f: (x: number) => Math.cos(toRad(x)) },
    { l: 'tan', f: (x: number) => Math.tan(toRad(x)) },
    { l: 'log', f: Math.log10 },
    { l: 'ln', f: Math.log },
    { l: '√', f: Math.sqrt },
    { l: 'x²', f: (x: number) => x * x },
    { l: 'x³', f: (x: number) => x * x * x },
    { l: '1/x', f: (x: number) => 1 / x },
    { l: '|x|', f: Math.abs },
    { l: 'n!', f: (x: number) => { let r = 1; for (let i = 2; i <= x; i++) r *= i; return r } },
    { l: '10ˣ', f: (x: number) => Math.pow(10, x) },
  ]

  const sbtn = (l: string, b: string, onClick: () => void) => (
    <button key={l} onClick={onClick} className={`p-2 text-xs rounded-sm font-medium transition-colors active:scale-90 duration-100 ${b}`}>{l}</button>
  )

  return (
    <div className="max-w-[260px] mx-auto">
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-3 mb-3 min-h-[4rem]">
        <div className="flex items-center justify-between text-xs text-text-secondary/60 min-h-[1rem] leading-tight">
          <span>{sci ? (rad ? 'RAD' : 'DEG') : ''}</span>
          <span className="overflow-hidden text-ellipsis text-right ml-2">{expr}&nbsp;</span>
        </div>
        <div className="text-2xl font-mono text-text-primary text-right leading-loose overflow-hidden">{display}</div>
      </div>

      {sci && (
        <>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {funcs.slice(0, 4).map(f => sbtn(f.l, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => apply(f.f, f.l)))}
            {funcs.slice(4, 8).map(f => sbtn(f.l, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => apply(f.f, f.l)))}
            {funcs.slice(8, 12).map(f => sbtn(f.l, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => apply(f.f, f.l)))}
          </div>
          <div className="flex gap-1 mb-2 flex-wrap">
            {sbtn('π', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { setDisplay(String(Math.PI)); setExpr('π') })}
            {sbtn('e', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { setDisplay(String(Math.E)); setExpr('e') })}
            {sbtn('RAD', rad ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]', () => setRad(!rad))}
            {sbtn('MC', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setMem(null))}
            {sbtn('MR', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { if (mem !== null) { setDisplay(String(mem)); setExpr('MR') } })}
            {sbtn('M+', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { setMem(parseFloat(display)); setExpr('M+') })}
          </div>
        </>
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
        {btn(sci ? '▼科学' : '科学▶', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 text-xs', () => setSci(!sci))}
        {btn('0', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('0'))}
        {btn('.', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('.'))}
        {btn('=', 'bg-accent text-white font-bold hover:opacity-90', equals)}
      </div>
    </div>
  )
}

// ─── Currency Converter ──────────────────────────────
function CurrencyCalc() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CNY')
  const a = parseFloat(amount)
  const result = isNaN(a) ? null : a / RATES[from] * RATES[to]

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-3">
          <label className="block text-xs text-text-secondary mb-1">金额</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">从</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-center text-lg text-text-secondary pt-5">→</div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">到</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {result !== null && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{result.toFixed(4)}</p>
          <p className="text-xs text-text-secondary mt-1">{amount} {from} = {result.toFixed(4)} {to}</p>
        </div>
      )}
    </div>
  )
}

// ─── Unit Converter ──────────────────────────────────
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
]

const AREA: Unit[] = [
  { label: 'mm²', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
  { label: 'cm²', toBase: v => v / 1e4, fromBase: v => v * 1e4 },
  { label: 'm²', toBase: v => v, fromBase: v => v },
  { label: 'km²', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
  { label: 'ha', toBase: v => v * 1e4, fromBase: v => v / 1e4 },
  { label: 'acre', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
  { label: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
]

const VOLUME: Unit[] = [
  { label: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
  { label: 'L', toBase: v => v, fromBase: v => v },
  { label: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
  { label: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
  { label: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
  { label: 'cup', toBase: v => v * 0.236588, fromBase: v => v / 0.236588 },
  { label: 'fl oz', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
]

const SPEED: Unit[] = [
  { label: 'm/s', toBase: v => v, fromBase: v => v },
  { label: 'km/h', toBase: v => v / 3.6, fromBase: v => v * 3.6 },
  { label: 'mph', toBase: v => v * 0.44704, fromBase: v => v / 0.44704 },
  { label: 'kn', toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
  { label: 'ft/s', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
  { label: 'Mach', toBase: v => v * 343, fromBase: v => v / 343 },
]

function UnitCalc({ title, units }: { title: string; units: Unit[] }) {
  const [val, setVal] = useState('1')
  const [from, setFrom] = useState(units[0]?.label || '')
  const [to, setTo] = useState(units[1]?.label || '')
  const uFrom = units.find(u => u.label === from)
  const uTo = units.find(u => u.label === to)
  const n = parseFloat(val)
  const result = (isNaN(n) || !uFrom || !uTo) ? null : uTo.fromBase(uFrom.toBase(n))

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-3">
          <label className="block text-xs text-text-secondary mb-1">{title}</label>
          <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {units.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
          </select>
        </div>
        <div className="text-center text-lg text-text-secondary pt-1">→</div>
        <div>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {units.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
          </select>
        </div>
      </div>
      {result !== null && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{result.toFixed(6)}</p>
          <p className="text-xs text-text-secondary mt-1">{val} {from} = {result.toFixed(6)} {to}</p>
        </div>
      )}
    </div>
  )
}

// ─── Temperature Converter ───────────────────────────
function TempCalc() {
  const [val, setVal] = useState('100')
  const [from, setFrom] = useState('°C')
  const [to, setTo] = useState('°F')
  const n = parseFloat(val)

  const convert = (v: number, f: string, t: string): number => {
    let c = f === '°C' ? v : f === '°F' ? (v - 32) / 1.8 : v - 273.15
    return t === '°C' ? c : t === '°F' ? c * 1.8 + 32 : c + 273.15
  }

  const result = isNaN(n) ? null : convert(n, from, to)

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-3">
          <label className="block text-xs text-text-secondary mb-1">温度转换</label>
          <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {['°C', '°F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="text-center text-lg text-text-secondary pt-1">→</div>
        <div>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {['°C', '°F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {result !== null && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{result.toFixed(2)}</p>
          <p className="text-xs text-text-secondary mt-1">{val}{from} = {result.toFixed(2)}{to}</p>
        </div>
      )}
    </div>
  )
}

// ─── BMI Calculator ──────────────────────────────────
function BmiCalc() {
  const [h, setH] = useState('170')
  const [w, setW] = useState('70')
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric')
  const height = parseFloat(h); const weight = parseFloat(w)
  const bmi = (isNaN(height) || isNaN(weight) || height <= 0) ? null
    : ((unit === 'metric' ? weight : weight * 0.453592) / ((unit === 'metric' ? height : height * 2.54) / 100) ** 2)
  const cat = bmi ? (bmi < 18.5 ? '偏瘦' : bmi < 25 ? '正常' : bmi < 30 ? '偏胖' : '肥胖') : null

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="flex gap-1">
        <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'metric' ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>公制</button>
        <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'imperial' ? 'bg-accent text-white' : 'bg-surface text-text-secondary'}`}>英制</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">身高 ({unit === 'metric' ? 'cm' : 'in'})</label>
          <input value={h} onChange={e => setH(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">体重 ({unit === 'metric' ? 'kg' : 'lb'})</label>
          <input value={w} onChange={e => setW(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {bmi && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{bmi.toFixed(1)}</p>
          <p className="text-sm text-text-secondary mt-1">{cat}</p>
        </div>
      )}
    </div>
  )
}

// ─── Tax Calculator (China) ──────────────────────────
function TaxCalc() {
  const [salary, setSalary] = useState('15000')
  const s = parseFloat(salary)
  const threshold = 5000
  const result = (() => {
    if (isNaN(s) || s <= threshold) return { taxable: 0, tax: 0, rate: '0%' }
    const taxable = s - threshold
    let tax = 0
    if (taxable <= 3000) { tax = taxable * 0.03; return { taxable, tax, rate: '3%' } }
    tax = 3000 * 0.03
    if (taxable <= 12000) { tax += (taxable - 3000) * 0.1; return { taxable, tax, rate: '10%' } }
    tax += 9000 * 0.1
    if (taxable <= 25000) { tax += (taxable - 12000) * 0.2; return { taxable, tax, rate: '20%' } }
    tax += 13000 * 0.2
    if (taxable <= 35000) { tax += (taxable - 25000) * 0.25; return { taxable, tax, rate: '25%' } }
    tax += 10000 * 0.25
    if (taxable <= 55000) { tax += (taxable - 35000) * 0.3; return { taxable, tax, rate: '30%' } }
    tax += 20000 * 0.3
    if (taxable <= 80000) { tax += (taxable - 55000) * 0.35; return { taxable, tax, rate: '35%' } }
    tax += 25000 * 0.35
    tax += (taxable - 80000) * 0.45
    return { taxable, tax, rate: '45%' }
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div>
        <label className="block text-xs text-text-secondary mb-1">税前月薪 (元)</label>
        <input value={salary} onChange={e => setSalary(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
      </div>
      {result && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] space-y-1 text-sm">
          <p className="flex justify-between"><span>应纳税所得额</span><span className="font-medium">¥{result.taxable.toFixed(0)}</span></p>
          <p className="flex justify-between"><span>适用税率</span><span className="font-medium">{result.rate}</span></p>
          <p className="flex justify-between border-t border-[rgba(127,99,21,0.1)] pt-1"><span>应缴个税</span><span className="text-accent font-bold">¥{result.tax.toFixed(0)}</span></p>
          <p className="flex justify-between"><span>税后收入</span><span className="text-green-600 font-bold">¥{(s - result.tax).toFixed(0)}</span></p>
        </div>
      )}
    </div>
  )
}

// ─── Mortgage Calculator ─────────────────────────────
function MortgageCalc() {
  const [total, setTotal] = useState('3000000')
  const [years, setYears] = useState('30')
  const [rate, setRate] = useState('3.85')
  const p = parseFloat(total); const n = parseFloat(years) * 12; const r = parseFloat(rate) / 100 / 12
  const monthly = (isNaN(p) || isNaN(n) || isNaN(r) || n <= 0 || r <= 0) ? null : p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-text-secondary mb-1">贷款总额 (元)</label>
          <input value={total} onChange={e => setTotal(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">年限</label>
          <input value={years} onChange={e => setYears(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">年利率 (%)</label>
          <input value={rate} onChange={e => setRate(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {monthly !== null && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] space-y-1 text-sm">
          <p className="flex justify-between"><span>月供</span><span className="text-accent font-bold text-lg">¥{monthly.toFixed(0)}</span></p>
          <p className="flex justify-between"><span>总利息</span><span className="font-medium">¥{(monthly * n - p).toFixed(0)}</span></p>
          <p className="flex justify-between"><span>还款总额</span><span className="font-medium">¥{(monthly * n).toFixed(0)}</span></p>
        </div>
      )}
    </div>
  )
}

// ─── Chinese Uppercase Number ────────────────────────
function ChineseNumCalc() {
  const [num, setNum] = useState('12345.67')
  const n = parseFloat(num)
  const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const UNITS = ['', '拾', '佰', '仟']
  const BIG = ['', '万', '亿']

  const result = (() => {
    if (isNaN(n)) return null
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
        if (segStr) s = segStr + BIG[i] + s
        else if (s) s = '零' + s
        int = Math.floor(int / 10000)
        i++
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

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div>
        <label className="block text-xs text-text-secondary mb-1">输入数字</label>
        <input value={num} onChange={e => setNum(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
      </div>
      {result && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-sm text-text-primary leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  )
}

// ─── Time Converter ──────────────────────────────────
function TimeCalc() {
  const [val, setVal] = useState('3600')
  const [from, setFrom] = useState('seconds')
  const [to, setTo] = useState('hours')
  const n = parseFloat(val)

  const toSeconds = (v: number, u: string) => {
    switch (u) {
      case 'seconds': return v; case 'minutes': return v * 60
      case 'hours': return v * 3600; case 'days': return v * 86400
      case 'weeks': return v * 604800; default: return v
    }
  }
  const fromSeconds = (v: number, u: string) => {
    switch (u) {
      case 'seconds': return v; case 'minutes': return v / 60
      case 'hours': return v / 3600; case 'days': return v / 86400
      case 'weeks': return v / 604800; default: return v
    }
  }

  const result = isNaN(n) ? null : fromSeconds(toSeconds(n, from), to)

  const units = ['seconds', 'minutes', 'hours', 'days', 'weeks']

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div className="col-span-3">
          <label className="block text-xs text-text-secondary mb-1">时间转换</label>
          <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="text-center text-lg text-text-secondary pt-1">→</div>
        <div>
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {result !== null && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-2xl font-bold text-accent">{result.toFixed(4)}</p>
          <p className="text-xs text-text-secondary mt-1">{val} {from} = {result.toFixed(4)} {to}</p>
        </div>
      )}
    </div>
  )
}

// ─── Chinese Title / Address Form of Address ─────────
function TitleCalc() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('30')
  const a = parseInt(age)

  const title = (() => {
    if (!name.trim()) return null
    if (isNaN(a)) return null
    if (a < 12) return '小朋友'
    if (a < 18) return '同学'
    return gender === 'male' ? '先生' : '女士'
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-text-secondary mb-1">姓名</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="请输入姓名" className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">性别</label>
          <div className="flex gap-1">
            <button onClick={() => setGender('male')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'male' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>男</button>
            <button onClick={() => setGender('female')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'female' ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>女</button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">年龄</label>
          <input value={age} onChange={e => setAge(e.target.value)} className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        </div>
      </div>
      {title && (
        <div className="p-3 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-center">
          <p className="text-lg text-text-primary">{name}{title}</p>
          <p className="text-xs text-text-secondary mt-1">例如：邮件、信函开头称呼</p>
        </div>
      )}
    </div>
  )
}

// ─── Number Base Converter ───────────────────────────
function BaseCalc() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [results, setResults] = useState<{ base: number; label: string; value: string }[]>([])
  const [error, setError] = useState('')

  const BASES = [
    { base: 2, label: 'BIN' }, { base: 8, label: 'OCT' },
    { base: 10, label: 'DEC' }, { base: 16, label: 'HEX' },
  ]

  const convert = () => {
    setError('')
    if (!input.trim()) { setResults([]); return }
    const decimal = parseInt(input, fromBase)
    if (isNaN(decimal)) { setError('输入无效'); return }
    setResults(BASES.map(({ base, label }) => ({
      base, label,
      value: decimal.toString(base).toUpperCase(),
    })))
  }

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入数字"
          className="flex-1 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary" />
        <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))}
          className="p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
          {BASES.map(b => <option key={b.base} value={b.base}>{b.label}</option>)}
        </select>
        <button onClick={convert} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">转换</button>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-1">
          {results.map(r => (
            <div key={r.base} className="flex items-center gap-2 p-2 bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] text-sm">
              <span className="w-12 text-accent font-mono text-xs font-bold">{r.label}</span>
              <code className="flex-1 font-mono text-text-primary">{r.value}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}