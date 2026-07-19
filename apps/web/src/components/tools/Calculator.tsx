'use client'

import { useState, useEffect } from 'react'

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

const TABS: { id: Tab; label: string }[] = [
  { id: 'calc', label: '计算器' }, { id: 'currency', label: '汇率' },
  { id: 'length', label: '长度' }, { id: 'weight', label: '重量' },
  { id: 'area', label: '面积' }, { id: 'volume', label: '体积' },
  { id: 'temp', label: '温度' }, { id: 'speed', label: '速度' },
  { id: 'bmi', label: 'BMI' }, { id: 'tax', label: '个税' },
  { id: 'mortgage', label: '房贷' }, { id: 'chinese', label: '大写' },
  { id: 'time', label: '时间' }, { id: 'title', label: '称呼' },
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
      {tab === 'length' && <UnitTable units={LENGTH} title="长度转换" />}
      {tab === 'weight' && <UnitTable units={WEIGHT} title="重量转换" />}
      {tab === 'area' && <UnitTable units={AREA} title="面积转换" />}
      {tab === 'volume' && <UnitTable units={VOLUME} title="体积转换" />}
      {tab === 'temp' && <TempCalc />}
      {tab === 'speed' && <UnitTable units={SPEED} title="速度转换" />}
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
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-3 mb-3 min-h-[4rem]">
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
        {btn(sci ? '科学' : '基础', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 text-xs', () => setSci(!sci))}
        {btn('0', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('0'))}
        {btn('.', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('.'))}
        {btn('=', 'bg-accent text-white font-bold hover:opacity-90', equals)}
      </div>
    </div>
  )
}

// ─── Improved Currency Converter ─────────────────────
function CurrencyCalc() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CNY')
  const a = parseFloat(amount)
  const result = isNaN(a) ? null : a / RATES[from] * RATES[to]

  const swap = () => { setFrom(to); setTo(from) }

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <div>
            <label className="block text-xs text-text-secondary mb-1">金额</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div />
          <div />
          <div>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
              {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={swap} className="p-2 text-lg text-accent hover:opacity-70 self-center">⇄</button>
          <div>
            <select value={to} onChange={e => setTo(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
              {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {result !== null && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)] text-center">
            <p className="text-xs text-text-secondary/60">{amount} {from} =</p>
            <p className="text-2xl font-bold text-accent">{result.toFixed(4)}</p>
            <p className="text-xs text-text-secondary mt-1">1 {from} = {(1 / RATES[from] * RATES[to]).toFixed(6)} {to}</p>
          </div>
        )}
      </div>
      {/* All currencies table */}
      {result !== null && (
        <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-3">
          <p className="text-xs text-text-secondary/60 mb-2">{amount} {from} 兑换所有货币</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.keys(RATES).filter(c => c !== from).map(c => (
              <div key={c} className="flex justify-between p-1.5 bg-white rounded-sm">
                <span className="text-text-secondary">{c}</span>
                <span className="text-text-primary font-mono">{(a / RATES[from] * RATES[c]).toFixed(4)}</span>
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
  const [val, setVal] = useState('1')
  const [from, setFrom] = useState(units[0]?.label || '')
  const n = parseFloat(val)
  const uFrom = units.find(u => u.label === from)

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">{title}</label>
            <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-24">
            <label className="block text-xs text-text-secondary mb-1">单位</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
              {units.map(u => <option key={u.label} value={u.label}>{u.label}</option>)}
            </select>
          </div>
        </div>
        {!isNaN(n) && uFrom && (
          <div className="space-y-0.5">
            {units.filter(u => u.label !== from).map(u => (
              <div key={u.label} className="flex justify-between p-1.5 bg-white rounded-sm text-xs">
                <span className="text-text-secondary">{u.label}</span>
                <span className="text-text-primary font-mono">{u.fromBase(uFrom.toBase(n)).toFixed(6)}</span>
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
  const [val, setVal] = useState('100')
  const [unit, setUnit] = useState<'C' | 'F' | 'K'>('C')
  const n = parseFloat(val)
  const toC = (v: number, u: string) => {
    if (u === 'C') return v; if (u === 'F') return (v - 32) / 1.8; return v - 273.15
  }
  const c = isNaN(n) ? null : toC(n, unit)
  const f = c !== null ? c * 1.8 + 32 : null
  const k = c !== null ? c + 273.15 : null

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">温度值</label>
            <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-24">
            <label className="block text-xs text-text-secondary mb-1">单位</label>
            <select value={unit} onChange={e => setUnit(e.target.value as 'C' | 'F' | 'K')} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
              <option value="C">°C</option><option value="F">°F</option><option value="K">K</option>
            </select>
          </div>
        </div>
        {c !== null && (
          <div className="space-y-2">
            <div className="flex justify-between p-2 bg-white rounded-sm text-sm">
              <span className="text-text-secondary">°C (摄氏度)</span>
              <span className="text-text-primary font-mono font-bold">{c!.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-sm text-sm">
              <span className="text-text-secondary">°F (华氏度)</span>
              <span className="text-text-primary font-mono font-bold">{f!.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-sm text-sm">
              <span className="text-text-secondary">K (开尔文)</span>
              <span className="text-text-primary font-mono font-bold">{k!.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-sm text-sm">
              <span className="text-text-secondary">°Ré (列氏度)</span>
              <span className="text-text-primary font-mono font-bold">{(c * 0.8).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Improved BMI ────────────────────────────────────
function BmiCalc() {
  const [h, setH] = useState('170')
  const [w, setW] = useState('70')
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric')
  const height = parseFloat(h); const weight = parseFloat(w)
  const bmi = (isNaN(height) || isNaN(weight) || height <= 0) ? null
    : ((unit === 'metric' ? weight : weight * 0.453592) / ((unit === 'metric' ? height : height * 2.54) / 100) ** 2)
  const cat = bmi ? (bmi < 18.5 ? '偏瘦' : bmi < 25 ? '正常' : bmi < 30 ? '偏胖' : '肥胖') : null
  const color = bmi ? (bmi < 18.5 ? 'bg-blue-400' : bmi < 25 ? 'bg-green-400' : bmi < 30 ? 'bg-amber-400' : 'bg-red-400') : ''
  const healthyMin = unit === 'metric' ? (18.5 * (height / 100) ** 2).toFixed(0) : ''
  const healthyMax = unit === 'metric' ? (24.9 * (height / 100) ** 2).toFixed(0) : ''

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-1 mb-3">
          <button onClick={() => setUnit('metric')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'metric' ? 'bg-accent text-white' : 'bg-white text-text-secondary'}`}>公制</button>
          <button onClick={() => setUnit('imperial')} className={`px-3 py-1 text-xs rounded-sm ${unit === 'imperial' ? 'bg-accent text-white' : 'bg-white text-text-secondary'}`}>英制</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">身高 ({unit === 'metric' ? 'cm' : 'in'})</label>
            <input value={h} onChange={e => setH(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">体重 ({unit === 'metric' ? 'kg' : 'lb'})</label>
            <input value={w} onChange={e => setW(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
        </div>
        {bmi && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)]">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg`}>{bmi.toFixed(1)}</div>
              <div>
                <p className="text-sm font-medium text-text-primary">{cat}</p>
                {unit === 'metric' && <p className="text-xs text-text-secondary">健康体重范围: {healthyMin} - {healthyMax} kg</p>}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-400" style={{ width: '18.5%' }} />
              <div className="h-full bg-green-400" style={{ width: '25%' }} />
              <div className="h-full bg-amber-400" style={{ width: '20%' }} />
              <div className="h-full bg-red-400" style={{ width: '36.5%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-secondary/60 mt-0.5">
              <span>18.5</span><span>25</span><span>30</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Improved Tax Calculator (monthly + yearly) ──────
function TaxCalc() {
  const [salary, setSalary] = useState('15000')
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly')
  const s = parseFloat(salary)
  const threshold = mode === 'monthly' ? 5000 : 60000
  const brackets = mode === 'monthly' ? [
    { low: 0, high: 3000, rate: 0.03, deduct: 0, label: '不超过 3000 元' },
    { low: 3000, high: 12000, rate: 0.1, deduct: 210, label: '3000 - 12000 元' },
    { low: 12000, high: 25000, rate: 0.2, deduct: 1410, label: '12000 - 25000 元' },
    { low: 25000, high: 35000, rate: 0.25, deduct: 2660, label: '25000 - 35000 元' },
    { low: 35000, high: 55000, rate: 0.3, deduct: 4410, label: '35000 - 55000 元' },
    { low: 55000, high: 80000, rate: 0.35, deduct: 7160, label: '55000 - 80000 元' },
    { low: 80000, high: Infinity, rate: 0.45, deduct: 15160, label: '超过 80000 元' },
  ] : [
    { low: 0, high: 36000, rate: 0.03, deduct: 0, label: '不超过 36000 元' },
    { low: 36000, high: 144000, rate: 0.1, deduct: 2520, label: '36000 - 144000 元' },
    { low: 144000, high: 300000, rate: 0.2, deduct: 16920, label: '144000 - 300000 元' },
    { low: 300000, high: 420000, rate: 0.25, deduct: 31920, label: '300000 - 420000 元' },
    { low: 420000, high: 660000, rate: 0.3, deduct: 52920, label: '420000 - 660000 元' },
    { low: 660000, high: 960000, rate: 0.35, deduct: 85920, label: '660000 - 960000 元' },
    { low: 960000, high: Infinity, rate: 0.45, deduct: 181920, label: '超过 960000 元' },
  ]

  const result = (() => {
    if (isNaN(s) || s <= threshold) return null
    const taxable = s - threshold
    const bracket = brackets.find(b => taxable <= b.high) || brackets[brackets.length - 1]
    const tax = taxable * bracket.rate - bracket.deduct
    return { taxable, tax: Math.max(0, tax), rate: bracket.rate, bracket: bracket.label }
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-1 mb-3">
          <button onClick={() => setMode('monthly')} className={`px-3 py-1 text-xs rounded-sm ${mode === 'monthly' ? 'bg-accent text-white' : 'bg-white text-text-secondary'}`}>月薪</button>
          <button onClick={() => setMode('yearly')} className={`px-3 py-1 text-xs rounded-sm ${mode === 'yearly' ? 'bg-accent text-white' : 'bg-white text-text-secondary'}`}>年薪</button>
        </div>
        <label className="block text-xs text-text-secondary mb-1">{mode === 'monthly' ? '税前月薪' : '税前年薪'} (元)</label>
        <input value={salary} onChange={e => setSalary(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        {result && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm p-2 bg-white rounded-sm">
              <span className="text-text-secondary">应纳税所得额</span>
              <span className="font-medium">¥{result.taxable.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm p-2 bg-white rounded-sm">
              <span className="text-text-secondary">适用税率档</span>
              <span className="font-medium">{(result.rate * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm p-2 bg-white rounded-sm">
              <span className="text-text-secondary">应缴个税</span>
              <span className="text-accent font-bold">¥{result.tax.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm p-2 bg-green-50 rounded-sm border border-green-200">
              <span className="text-green-700">税后收入</span>
              <span className="text-green-700 font-bold">¥{(s - result.tax).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
      {result && (
        <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-3">
          <p className="text-xs text-text-secondary/60 mb-2">税率表参考</p>
          <div className="space-y-0.5">
            {brackets.map(b => (
              <div key={b.low} className={`flex justify-between text-xs p-1.5 rounded-sm ${b.label === result.bracket ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary'}`}>
                <span>{b.label}</span>
                <span>{(b.rate * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Improved Mortgage Calculator ────────────────────
function MortgageCalc() {
  const [total, setTotal] = useState('3000000')
  const [years, setYears] = useState('30')
  const [rate, setRate] = useState('3.85')
  const p = parseFloat(total); const n = parseFloat(years) * 12; const r = parseFloat(rate) / 100 / 12
  const monthly = (isNaN(p) || isNaN(n) || isNaN(r) || n <= 0 || r <= 0) ? null : p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-text-secondary mb-1">贷款总额 (元)</label>
            <input value={total} onChange={e => setTotal(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">年限</label>
            <input value={years} onChange={e => setYears(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">年利率 (%)</label>
            <input value={rate} onChange={e => setRate(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
        </div>
        {monthly !== null && (
          <div className="mt-3 pt-3 border-t border-[rgba(127,99,21,0.1)] space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded-sm">
              <span className="text-text-secondary text-sm">月供</span>
              <span className="text-accent font-bold text-lg">¥{monthly.toFixed(0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded-sm text-center">
                <p className="text-xs text-text-secondary">总利息</p>
                <p className="text-sm font-medium">¥{(monthly * n - p).toFixed(0)}</p>
              </div>
              <div className="p-2 bg-white rounded-sm text-center">
                <p className="text-xs text-text-secondary">还款总额</p>
                <p className="text-sm font-medium">¥{(monthly * n).toFixed(0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
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

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <label className="block text-xs text-text-secondary mb-1">输入数字</label>
        <input value={num} onChange={e => setNum(e.target.value)} placeholder="12345.67" className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
        {result && (
          <div className="mt-3 p-3 bg-white rounded-sm border border-[rgba(127,99,21,0.08)]">
            <p className="text-sm text-text-primary leading-relaxed">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Time Converter ──────────────────────────────────
function TimeCalc() {
  const [val, setVal] = useState('3600')
  const [from, setFrom] = useState('seconds')
  const n = parseFloat(val)
  const toSeconds = (v: number, u: string) => {
    switch (u) { case 'seconds': return v; case 'minutes': return v * 60; case 'hours': return v * 3600; case 'days': return v * 86400; case 'weeks': return v * 604800; case 'months': return v * 2592000; case 'years': return v * 31536000; default: return v }
  }
  const units = [
    { label: 'seconds', labelZh: '秒' }, { label: 'minutes', labelZh: '分钟' },
    { label: 'hours', labelZh: '小时' }, { label: 'days', labelZh: '天' },
    { label: 'weeks', labelZh: '周' }, { label: 'months', labelZh: '月 (30天)' },
    { label: 'years', labelZh: '年 (365天)' },
  ]
  const toUnit = (v: number, u: string) => {
    switch (u) { case 'seconds': return v; case 'minutes': return v / 60; case 'hours': return v / 3600; case 'days': return v / 86400; case 'weeks': return v / 604800; case 'months': return v / 2592000; case 'years': return v / 31536000; default: return v }
  }

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">时间转换</label>
            <input value={val} onChange={e => setVal(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-text-secondary mb-1">单位</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
              {units.map(u => <option key={u.label} value={u.label}>{u.labelZh}</option>)}
            </select>
          </div>
        </div>
        {!isNaN(n) && (
          <div className="space-y-0.5">
            {units.filter(u => u.label !== from).map(u => (
              <div key={u.label} className="flex justify-between p-1.5 bg-white rounded-sm text-xs">
                <span className="text-text-secondary">{u.labelZh}</span>
                <span className="text-text-primary font-mono">{toUnit(toSeconds(n, from), u.label).toFixed(6)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chinese Family Title Calculator ────────────────
function TitleCalc() {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('30')
  const [side, setSide] = useState('self')
  const a = parseInt(age)

  const title = (() => {
    if (!name.trim() || isNaN(a)) return null
    if (a < 18) return gender === 'male' ? '小弟弟' : '小妹妹'
    if (a < 30) return gender === 'male' ? '弟弟' : '妹妹'
    if (a < 40) return gender === 'male' ? '兄弟' : '姐妹'
    if (a < 55) return gender === 'male' ? '大哥' : '大姐'
    if (a < 70) return gender === 'male' ? '叔叔' : '阿姨'
    return gender === 'male' ? '爷爷' : '奶奶'
  })()

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-text-secondary mb-1">称呼对象</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="请输入姓名" className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">性别</label>
            <div className="flex gap-1">
              <button onClick={() => setGender('male')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'male' ? 'bg-accent text-white' : 'bg-white text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>男</button>
              <button onClick={() => setGender('female')} className={`flex-1 p-2 text-xs rounded-sm ${gender === 'female' ? 'bg-accent text-white' : 'bg-white text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>女</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">年龄</label>
            <input value={age} onChange={e => setAge(e.target.value)} className="w-full p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary" />
          </div>
        </div>
        {title && (
          <div className="mt-3 p-3 bg-white rounded-sm border border-[rgba(127,99,21,0.08)] text-center">
            <p className="text-lg text-text-primary">{name}{title}</p>
            <p className="text-xs text-text-secondary mt-1">适用于日常社交称呼</p>
          </div>
        )}
      </div>
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
    setResults(BASES.map(({ base, label }) => ({ base, label, value: decimal.toString(base).toUpperCase() })))
  }

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="bg-surface rounded-sm border border-[rgba(127,99,21,0.1)] p-4">
        <div className="flex gap-2 mb-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入数字"
            className="flex-1 p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm font-mono text-text-primary" />
          <select value={fromBase} onChange={e => setFromBase(parseInt(e.target.value))}
            className="p-2 bg-white border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary">
            {BASES.map(b => <option key={b.base} value={b.base}>{b.label}</option>)}
          </select>
          <button onClick={convert} className="px-4 py-2 bg-accent text-white text-sm rounded-sm hover:opacity-90">转换</button>
        </div>
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map(r => (
              <div key={r.base} className="flex items-center gap-2 p-2 bg-white rounded-sm border border-[rgba(127,99,21,0.08)] text-sm">
                <span className="w-12 text-accent font-mono text-xs font-bold">{r.label}</span>
                <code className="flex-1 font-mono text-text-primary">{r.value}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}