// calculator —— T1 纯计算：表达式求值 + 二元运算 + 单位换算
// 表达式求值用调度场算法（shunting-yard），不使用 eval / new Function。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readInt, readString } from './common'

export type CalculatorMode = 'expression' | 'binary' | 'convert'

export interface CalculatorInput {
  mode: CalculatorMode
  expression: string
  a: number
  b: number
  op: string
  value: number
  fromUnit: string
  toUnit: string
}

export interface CalculatorOutput {
  value: number
  display: string
}

const MODES: readonly CalculatorMode[] = ['expression', 'binary', 'convert']

// ─── 二元运算（语义与既有 Calculator.compute 一致） ────────────────────────

export function computeBinary(a: number, b: number, op: string): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return b !== 0 ? a / b : NaN
    case '%':
      return b !== 0 ? a % b : NaN
    default:
      return b
  }
}

// ─── 表达式求值 ────────────────────────────────────────────────────────────

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'operator'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }

/** 逆波兰输出队列中只可能剩数字与运算符 */
type RpnToken = Extract<Token, { kind: 'number' | 'operator' }>

const PRECEDENCE: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 }
const RIGHT_ASSOCIATIVE = new Set(['^'])

export function tokenizeExpression(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let expectOperand = true
  while (i < input.length) {
    const ch = input[i]
    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' })
      i++
      expectOperand = true
      continue
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' })
      i++
      expectOperand = false
      continue
    }
    if (/[0-9.]/.test(ch)) {
      let j = i
      while (j < input.length && /[0-9.]/.test(input[j])) j++
      const literal = input.slice(i, j)
      const value = Number.parseFloat(literal)
      if (Number.isNaN(value)) throw new Error('invalidNumber')
      tokens.push({ kind: 'number', value })
      i = j
      expectOperand = false
      continue
    }
    if ('+-*/%^'.includes(ch)) {
      if (expectOperand && (ch === '-' || ch === '+')) {
        // 一元正负号：折叠到数字上
        const sign = ch === '-' ? -1 : 1
        i++
        let j = i
        while (j < input.length && /[0-9.]/.test(input[j])) j++
        if (j === i) throw new Error('invalidExpression')
        const value = Number.parseFloat(input.slice(i, j))
        if (Number.isNaN(value)) throw new Error('invalidNumber')
        tokens.push({ kind: 'number', value: sign * value })
        i = j
        expectOperand = false
        continue
      }
      tokens.push({ kind: 'operator', value: ch })
      i++
      expectOperand = true
      continue
    }
    throw new Error('invalidExpression')
  }
  return tokens
}

export function evaluateExpression(input: string): number {
  const tokens = tokenizeExpression(input.trim())
  if (tokens.length === 0) throw new Error('emptyInput')

  const output: RpnToken[] = []
  const operators: string[] = []

  const popToOutput = (): void => {
    const op = operators.pop()
    if (op !== undefined) output.push({ kind: 'operator', value: op })
  }

  for (const token of tokens) {
    if (token.kind === 'number') {
      output.push({ kind: 'number', value: token.value })
      continue
    }
    if (token.kind === 'lparen') {
      operators.push('(')
      continue
    }
    if (token.kind === 'rparen') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') popToOutput()
      if (operators.length === 0) throw new Error('invalidExpression')
      operators.pop()
      continue
    }
    const current = token.value
    while (operators.length > 0) {
      const top = operators[operators.length - 1]
      if (top === '(') break
      const topPrec = PRECEDENCE[top] ?? 0
      const curPrec = PRECEDENCE[current] ?? 0
      if (topPrec > curPrec || (topPrec === curPrec && !RIGHT_ASSOCIATIVE.has(current))) {
        popToOutput()
      } else {
        break
      }
    }
    operators.push(current)
  }
  while (operators.length > 0) {
    const top = operators[operators.length - 1]
    if (top === '(') throw new Error('invalidExpression')
    popToOutput()
  }

  const stack: number[] = []
  for (const token of output) {
    if (token.kind === 'number') {
      stack.push(token.value)
      continue
    }
    const b = stack.pop()
    const a = stack.pop()
    if (a === undefined || b === undefined) throw new Error('invalidExpression')
    const result = token.value === '^' ? Math.pow(a, b) : computeBinary(a, b, token.value)
    if (Number.isNaN(result)) throw new Error('invalidExpression')
    stack.push(result)
  }
  if (stack.length !== 1) throw new Error('invalidExpression')
  return stack[0]
}

// ─── 单位换算 ──────────────────────────────────────────────────────────────

interface UnitDef {
  id: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

const LENGTH_UNITS: readonly UnitDef[] = [
  { id: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { id: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  { id: 'm', toBase: (v) => v, fromBase: (v) => v },
  { id: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'inch', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  { id: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
]

const WEIGHT_UNITS: readonly UnitDef[] = [
  { id: 'mg', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { id: 'g', toBase: (v) => v, fromBase: (v) => v },
  { id: 'kg', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'lb', toBase: (v) => v * 453.59237, fromBase: (v) => v / 453.59237 },
  { id: 'oz', toBase: (v) => v * 28.349523125, fromBase: (v) => v / 28.349523125 },
]

const TEMPERATURE_UNITS: readonly UnitDef[] = [
  { id: 'c', toBase: (v) => v, fromBase: (v) => v },
  { id: 'f', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
  { id: 'k', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
]

export const UNIT_GROUPS: Record<string, readonly UnitDef[]> = {
  length: LENGTH_UNITS,
  weight: WEIGHT_UNITS,
  temperature: TEMPERATURE_UNITS,
}

export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  for (const group of Object.values(UNIT_GROUPS)) {
    const from = group.find((u) => u.id === fromUnit)
    const to = group.find((u) => u.id === toUnit)
    if (from && to) return to.fromBase(from.toBase(value))
  }
  return NaN
}

// ─── Tool definition ───────────────────────────────────────────────────────

export function parseCalculator(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<CalculatorInput> {
  const mode = readEnum(raw, 'mode', MODES, 'expression')
  const expression = readString(raw, 'expression') ?? ''
  if (mode === 'expression' && expression.trim().length === 0) {
    return toolFail('emptyInput', 'tools.emptyInput')
  }
  return toolOk({
    mode,
    expression,
    a: readInt(raw, 'a', 0),
    b: readInt(raw, 'b', 0),
    op: readString(raw, 'op') ?? '+',
    value: readInt(raw, 'value', 0),
    fromUnit: readString(raw, 'fromUnit') ?? 'm',
    toUnit: readString(raw, 'toUnit') ?? 'cm',
  })
}

function formatNumber(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 'NaN'
  return String(Number(value.toFixed(10)))
}

export function runCalculator(input: CalculatorInput, _ctx: ToolContext): ToolOutcome<CalculatorOutput> {
  try {
    if (input.mode === 'expression') {
      const value = evaluateExpression(input.expression)
      return toolOk({ value, display: formatNumber(value) })
    }
    if (input.mode === 'binary') {
      const value = computeBinary(input.a, input.b, input.op)
      if (Number.isNaN(value)) return toolFail('invalidInput', 'tools.invalidInput')
      return toolOk({ value, display: formatNumber(value) })
    }
    const value = convertUnit(input.value, input.fromUnit, input.toUnit)
    if (Number.isNaN(value)) return toolFail('invalidInput', 'tools.invalidInput')
    return toolOk({ value, display: formatNumber(value) })
  } catch {
    return toolFail('invalidExpression', 'tools.invalidExpression')
  }
}

export function renderCalculator(out: CalculatorOutput, _ctx: ToolContext): string {
  return out.display
}

export const calculatorTool: ToolDefinition<CalculatorInput, CalculatorOutput> = {
  id: 'calculator',
  tier: 'T1',
  capabilities: [],
  inputs: [
    {
      name: 'mode',
      kind: 'select',
      required: false,
      labelKey: 'tools.mode',
      default: 'expression',
      options: [
        { value: 'expression', labelKey: 'tools.calcExpression' },
        { value: 'binary', labelKey: 'tools.calcBinary' },
        { value: 'convert', labelKey: 'tools.calcConvert' },
      ],
    },
    { name: 'expression', kind: 'text', required: false, labelKey: 'tools.calcExpression' },
    { name: 'a', kind: 'number', required: false, labelKey: 'tools.calcA', default: 0 },
    { name: 'b', kind: 'number', required: false, labelKey: 'tools.calcB', default: 0 },
    { name: 'op', kind: 'text', required: false, labelKey: 'tools.calcOp', default: '+' },
    { name: 'value', kind: 'number', required: false, labelKey: 'tools.calcValue', default: 0 },
    { name: 'fromUnit', kind: 'text', required: false, labelKey: 'tools.calcFromUnit', default: 'm' },
    { name: 'toUnit', kind: 'text', required: false, labelKey: 'tools.calcToUnit', default: 'cm' },
  ],
  parse: parseCalculator,
  run: runCalculator,
  render: renderCalculator,
}
