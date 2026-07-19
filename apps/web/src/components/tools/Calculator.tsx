'use client'

import { useState, useEffect } from 'react'

function compute(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b !== 0 ? a / b : NaN
    default: return b
  }
}

const btn = (label: string, base: string, onClick: () => void) => (
  <button key={label} onClick={onClick}
    className={`p-3 text-sm rounded-sm font-medium transition-colors active:scale-90 duration-100 ${base}`}>{label}</button>
)

export default function Calculator() {
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

  const apply = (fn: (x: number) => number, name: string) => {
    const v = parseFloat(display)
    if (isNaN(v)) return
    setExpr(`${name}(${v}) =`)
    setDisplay(String(fn(v)))
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

  const sbtn = (label: string, base: string, onClick: () => void) => (
    <button key={label} onClick={onClick}
      className={`p-2 text-xs rounded-sm font-medium transition-colors active:scale-90 duration-100 ${base}`}>{label}</button>
  )

  return (
    <div className="max-w-[260px] mx-auto">
      {/* Display */}
      <div className="bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm p-3 mb-3 min-h-[4rem]">
        <div className="text-xs text-text-secondary/60 text-right min-h-[1rem] leading-tight overflow-hidden text-ellipsis">{expr}&nbsp;</div>
        <div className="text-2xl font-mono text-text-primary text-right leading-loose overflow-hidden">{display}</div>
      </div>

      {/* Scientific functions (toggle with sci) */}
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

      {/* Number pad */}
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
        {btn(sci ? '▼SCI' : 'SCI▶', 'bg-surface text-accent border border-[rgba(127,99,21,0.1)] hover:border-accent/30 text-xs', () => setSci(!sci))}
        {btn('0', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('0'))}
        {btn('.', 'bg-surface text-text-primary border border-[rgba(127,99,21,0.1)] hover:border-accent/30', () => input('.'))}
        {btn('=', 'bg-accent text-white font-bold hover:opacity-90', equals)}
      </div>
    </div>
  )
}