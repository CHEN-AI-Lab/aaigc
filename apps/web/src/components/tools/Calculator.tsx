'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

type CalcTab = 'basic' | 'scientific'

export default function Calculator() {
  const t = useTranslations('tools')
  const [tab, setTab] = useState<CalcTab>('basic')

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-1 border-b border-[rgba(127,99,21,0.15)] pb-1">
        <button onClick={() => setTab('basic')}
          className={`px-4 py-2 text-sm rounded-t-sm transition-colors ${tab === 'basic' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
          {t('calcBasic')}
        </button>
        <button onClick={() => setTab('scientific')}
          className={`px-4 py-2 text-sm rounded-t-sm transition-colors ${tab === 'scientific' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
          {t('calcScientific')}
        </button>
      </div>
      {tab === 'basic' ? <BasicCalc /> : <ScientificCalc />}
    </div>
  )
}

// ─── Basic Calculator ─────────────────────────────────
function BasicCalc() {
  const [display, setDisplay] = useState('0')
  const [expr, setExpr] = useState('')
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [reset, setReset] = useState(false)

  // Keyboard support
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
      setExpr(`${prev} ${op} ${cur} =`)
      setDisplay(String(r))
      setPrev(r)
    } else {
      setExpr(cur + ' ' + next)
      setPrev(cur)
    }
    setOp(next)
    setReset(true)
  }

  const equals = () => {
    if (prev === null || !op) return
    const cur = parseFloat(display)
    const r = compute(prev, cur, op)
    setExpr(`${prev} ${op} ${cur} =`)
    setDisplay(String(r))
    setPrev(null); setOp(null); setReset(true)
  }

  const clear = () => { setDisplay('0'); setExpr(''); setPrev(null); setOp(null); setReset(false) }

  const btn = (label: string, base: string, onClick: () => void) => (
    <button key={label} onClick={onClick}
      className={`p-3 text-sm rounded-sm font-medium transition-colors active:scale-90 duration-100 ${base}`}>{label}</button>
  )

  return (
    <div className="max-w-[260px] mx-auto">
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-3 mb-3 min-h-[4rem]">
        <div className="text-xs text-text-secondary/60 text-right min-h-[1rem] leading-tight">{expr}&nbsp;</div>
        <div className="text-2xl font-mono text-text-primary text-right leading-loose overflow-hidden">{display}</div>
      </div>
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
        {btn('0', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30 col-span-2', () => input('0'))}
        {btn('.', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('.'))}
        {btn('=', 'bg-accent text-white font-bold hover:opacity-90', equals)}
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
  const [mem, setMem] = useState<number | null>(null)

  const input = (n: string) => setDisplay(d => d === '0' ? n : d + n)

  const apply = (fn: (x: number) => number) => {
    const v = parseFloat(display)
    if (isNaN(v)) return
    setDisplay(String(fn(v)))
  }

  const d = (x: number) => rad ? x : x * Math.PI / 180

  const btn = (label: string, cls: string, onClick: () => void, span?: string) => (
    <button key={label} onClick={onClick}
      className={`p-2 text-xs rounded-sm font-medium transition-colors ${cls} ${span || ''}`}>{label}</button>
  )

  const funcs = [
    { l: 'sin', f: (x: number) => Math.sin(d(x)) },
    { l: 'cos', f: (x: number) => Math.cos(d(x)) },
    { l: 'tan', f: (x: number) => Math.tan(d(x)) },
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

  return (
    <div className="max-w-[320px] mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-2 text-right text-lg font-mono text-text-primary min-h-[2.5rem] leading-loose">
          {display}
        </div>
        <button onClick={() => setRad(!rad)}
          className={`text-xs px-2 py-1 rounded-sm h-8 ${rad ? 'bg-accent text-white' : 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)]'}`}>RAD</button>
        <button onClick={() => { try { setDisplay(String(eval(display))) } catch { setDisplay('Error') } }}
          className="text-xs px-3 py-1 bg-accent text-white rounded-sm h-8">=</button>
      </div>
      <div className="grid grid-cols-6 gap-1 mb-1.5">
        {funcs.map(f => btn(f.l, 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => apply(f.f)))}
      </div>
      <div className="flex gap-1 mb-1.5">
        {btn('π', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setDisplay(String(Math.PI)))}
        {btn('e', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setDisplay(String(Math.E)))}
        {btn('MC', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setMem(null))}
        {btn('MR', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => { if (mem !== null) setDisplay(String(mem)) })}
        {btn('M+', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setMem(parseFloat(display)))}
        {btn('C', 'bg-surface text-text-secondary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => setDisplay('0'))}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','⌫','+'].map(k => {
          const isOp = '÷×−+'.includes(k)
          return btn(k, isOp ? 'bg-accent text-white hover:opacity-90' : 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30',
            () => {
              if (k === '⌫') setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
              else if (isOp) {
                try { setDisplay(String(eval(display) + (k === '÷' ? '/' : k === '×' ? '*' : k === '−' ? '-' : k))) }
                catch { /* ignore */ }
              } else input(k)
            })
        })}
      </div>
    </div>
  )
}