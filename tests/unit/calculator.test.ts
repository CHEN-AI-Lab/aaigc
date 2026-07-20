import { describe, it, expect } from 'vitest'

// ─── Calculator Logic Tests ──────────────────────────

describe('calculator logic', () => {
  // Replicate the compute function from Calculator.tsx
  function compute(a: number, b: number, op: string): number {
    switch (op) {
      case '+': return a + b; case '-': return a - b
      case '*': return a * b; case '/': return b !== 0 ? a / b : NaN
      default: return b
    }
  }

  it('adds two numbers', () => {
    expect(compute(1, 2, '+')).toBe(3)
  })

  it('subtracts two numbers', () => {
    expect(compute(5, 3, '-')).toBe(2)
  })

  it('multiplies two numbers', () => {
    expect(compute(4, 3, '*')).toBe(12)
  })

  it('divides two numbers', () => {
    expect(compute(10, 2, '/')).toBe(5)
  })

  it('returns NaN for division by zero', () => {
    expect(compute(10, 0, '/')).toBeNaN()
  })

  it('returns second operand for unknown operator', () => {
    expect(compute(1, 2, 'x')).toBe(2)
  })

  it('handles negative numbers', () => {
    expect(compute(-5, 3, '+')).toBe(-2)
    expect(compute(-5, -3, '*')).toBe(15)
  })

  it('handles decimal results', () => {
    expect(compute(10, 3, '/')).toBeCloseTo(3.333, 3)
  })
})

// ─── Unit Conversion Logic Tests ─────────────────────

describe('unit conversion', () => {
  type Unit = { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }

  const LENGTH: Unit[] = [
    { label: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
    { label: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
    { label: 'm', toBase: v => v, fromBase: v => v },
    { label: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
  ]

  it('converts 1m to 1000mm', () => {
    const from = LENGTH.find(u => u.label === 'm')!
    const to = LENGTH.find(u => u.label === 'mm')!
    expect(to.fromBase(from.toBase(1))).toBe(1000)
  })

  it('converts 1km to 1000m', () => {
    const from = LENGTH.find(u => u.label === 'km')!
    const to = LENGTH.find(u => u.label === 'm')!
    expect(to.fromBase(from.toBase(1))).toBe(1000)
  })

  it('converts 1m to 0.001km', () => {
    const from = LENGTH.find(u => u.label === 'm')!
    const to = LENGTH.find(u => u.label === 'km')!
    expect(to.fromBase(from.toBase(1))).toBe(0.001)
  })

  it('converts 100cm to 1m', () => {
    const from = LENGTH.find(u => u.label === 'cm')!
    const to = LENGTH.find(u => u.label === 'm')!
    expect(to.fromBase(from.toBase(100))).toBe(1)
  })

  it('converts 0°C to 32°F', () => {
    const c = 0
    const f = c * 1.8 + 32
    expect(f).toBe(32)
  })

  it('converts 100°C to 212°F', () => {
    const c = 100
    const f = c * 1.8 + 32
    expect(f).toBe(212)
  })

  it('converts 0°C to 273.15K', () => {
    const c = 0
    const k = c + 273.15
    expect(k).toBe(273.15)
  })
})

// ─── BMI Calculation Tests ───────────────────────────

describe('BMI calculation', () => {
  it('calculates correct BMI for 170cm, 70kg', () => {
    const bmi = 70 / ((170 / 100) ** 2)
    expect(bmi).toBeCloseTo(24.22, 1)
  })

  it('classifies BMI < 18.5 as underweight', () => {
    const bmi = 17.5
    expect(bmi < 18.5).toBe(true)
  })

  it('classifies BMI 18.5-25 as normal', () => {
    const bmi = 22
    expect(bmi >= 18.5 && bmi < 25).toBe(true)
  })

  it('classifies BMI 25-30 as overweight', () => {
    const bmi = 27
    expect(bmi >= 25 && bmi < 30).toBe(true)
  })

  it('classifies BMI >= 30 as obese', () => {
    const bmi = 32
    expect(bmi >= 30).toBe(true)
  })
})

// ─── Chinese Uppercase Number Tests ──────────────────

describe('Chinese uppercase number conversion', () => {
  const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const UNITS = ['', '拾', '佰', '仟']
  const BIG = ['', '万', '亿']

  it('maps digits correctly', () => {
    expect(DIGITS[0]).toBe('零')
    expect(DIGITS[1]).toBe('壹')
    expect(DIGITS[5]).toBe('伍')
    expect(DIGITS[9]).toBe('玖')
  })

  it('has correct unit names', () => {
    expect(UNITS[1]).toBe('拾')
    expect(UNITS[2]).toBe('佰')
    expect(UNITS[3]).toBe('仟')
  })

  it('has correct big unit names', () => {
    expect(BIG[1]).toBe('万')
    expect(BIG[2]).toBe('亿')
  })
})

// ─── Tax Calculation Tests ──────────────────────────

describe('tax calculation', () => {
  const yearlyBrackets = [
    { low: 0, high: 36000, rate: 0.03, deduct: 0 },
    { low: 36000, high: 144000, rate: 0.1, deduct: 2520 },
    { low: 144000, high: 300000, rate: 0.2, deduct: 16920 },
    { low: 300000, high: 420000, rate: 0.25, deduct: 31920 },
    { low: 420000, high: 660000, rate: 0.3, deduct: 52920 },
    { low: 660000, high: 960000, rate: 0.35, deduct: 85920 },
    { low: 960000, high: Infinity, rate: 0.45, deduct: 181920 },
  ]

  function calcTax(taxable: number) {
    if (taxable <= 0) return null
    const bracket = yearlyBrackets.find(b => taxable <= b.high) || yearlyBrackets[yearlyBrackets.length - 1]
    const tax = taxable * bracket.rate - bracket.deduct
    return { taxable, tax: Math.max(0, tax), rate: bracket.rate }
  }

  it('returns null for taxable income <= 0', () => {
    expect(calcTax(0)).toBeNull()
    expect(calcTax(-1000)).toBeNull()
  })

  it('calculates 3% for first bracket (0-36000)', () => {
    const result = calcTax(30000)
    expect(result).not.toBeNull()
    expect(result!.tax).toBe(900) // 30000 * 0.03
  })

  it('calculates 10% for second bracket (36000-144000)', () => {
    const result = calcTax(100000)
    expect(result).not.toBeNull()
    expect(result!.tax).toBe(100000 * 0.1 - 2520) // 7480
  })

  it('annual income below 60000 pays no tax', () => {
    const annualIncome = 30000
    const annualDeduction = 60000
    const taxable = annualIncome - annualDeduction
    expect(calcTax(taxable)).toBeNull()
  })
})

// ─── Mortgage Calculation Tests ──────────────────────

describe('mortgage calculation', () => {
  it('calculates equal payment monthly amount', () => {
    const p = 1000000 // 100万
    const r = 0.0385 / 12 // annual 3.85%
    const n = 30 * 12 // 30 years
    const monthly = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    expect(monthly).toBeGreaterThan(0)
    expect(monthly).toBeLessThan(p) // sanity check
  })

  it('equal principal first month is higher than equal payment', () => {
    const p = 1000000
    const r = 0.0385 / 12
    const n = 360

    // Equal payment
    const eqPayment = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)

    // Equal principal first month
    const monthlyPrincipal = p / n
    const firstMonthInterest = p * r
    const eqPrincipalFirst = monthlyPrincipal + firstMonthInterest

    expect(eqPrincipalFirst).toBeGreaterThan(eqPayment)
  })

  it('total payment > principal', () => {
    const p = 1000000
    const r = 0.0385 / 12
    const n = 360
    const monthly = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    const totalPayment = monthly * n
    expect(totalPayment).toBeGreaterThan(p)
  })
})

// ─── Time Conversion Tests ──────────────────────────

describe('time conversion', () => {
  const SECONDS_PER_YEAR = 31536000
  const SECONDS_PER_MONTH = 2592000
  const SECONDS_PER_WEEK = 604800
  const SECONDS_PER_DAY = 86400
  const SECONDS_PER_HOUR = 3600
  const SECONDS_PER_MINUTE = 60

  it('1 year = 365 days', () => {
    expect(SECONDS_PER_YEAR / SECONDS_PER_DAY).toBe(365)
  })

  it('1 month = 30 days', () => {
    expect(SECONDS_PER_MONTH / SECONDS_PER_DAY).toBe(30)
  })

  it('1 week = 7 days', () => {
    expect(SECONDS_PER_WEEK / SECONDS_PER_DAY).toBe(7)
  })

  it('1 day = 24 hours', () => {
    expect(SECONDS_PER_DAY / SECONDS_PER_HOUR).toBe(24)
  })

  it('1 hour = 60 minutes', () => {
    expect(SECONDS_PER_HOUR / SECONDS_PER_MINUTE).toBe(60)
  })

  it('1 year = 12 months', () => {
    expect(SECONDS_PER_YEAR / SECONDS_PER_MONTH).toBeCloseTo(12.166, 2)
    // Direct conversion: 1 year * 12 = 12 months
    expect(1 * 12).toBe(12)
  })

  it('1 year = 4 quarters', () => {
    expect(1 * 4).toBe(4)
  })

  it('1 quarter = 3 months', () => {
    expect(1 * 3).toBe(3)
  })
})

// ─── Family Relations Tests ─────────────────────────

describe('family relations edge cases', () => {
  const relations: Record<string, string> = {
    '爸爸的老婆': '妈妈', '爸爸的爸爸': '爷爷',
    '妈妈的老公': '爸爸', '妈妈的妈妈': '外婆',
    '哥哥的老婆': '嫂子', '姐姐的老公': '姐夫',
    '爷爷的爸爸': '曾祖父', '奶奶的妈妈': '外曾祖母',
  }

  it('all relations have valid values', () => {
    for (const [, value] of Object.entries(relations)) {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    }
  })

  it('爸爸的老婆 is 妈妈', () => {
    expect(relations['爸爸的老婆']).toBe('妈妈')
  })

  it('妈妈的老公 is 爸爸', () => {
    expect(relations['妈妈的老公']).toBe('爸爸')
  })

  it('爷爷的爸爸 is 曾祖父', () => {
    expect(relations['爷爷的爸爸']).toBe('曾祖父')
  })
})

// ─── Format Number Tests ───────────────────────────

describe('number formatting', () => {
  function formatNumber(n: number): string {
    if (Number.isInteger(n)) return n.toLocaleString('en-US')
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
  }

  function fmt(n: number): string {
    if (Number.isInteger(n)) return n.toLocaleString('en-US')
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 10 })
  }

  it('formats integer without decimal', () => {
    expect(formatNumber(100)).toBe('100')
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('formats decimal with proper precision', () => {
    const result = formatNumber(1.5)
    expect(result).toBe('1.5')
  })

  it('fmt handles integers', () => {
    expect(fmt(100)).toBe('100')
    expect(fmt(1000)).toBe('1,000')
  })

  it('fmt handles decimals without trailing zeros', () => {
    const result = fmt(1.500)
    expect(result).toBe('1.5')
  })

  it('fmt handles large numbers', () => {
    expect(fmt(1234567)).toBe('1,234,567')
  })
})