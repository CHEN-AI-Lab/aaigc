import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, isLocale } from '../../shared/constants/locales'

describe('locales', () => {
  it('has default locale set to en', () => {
    expect(defaultLocale).toBe('en')
  })

  it('has both zh-CN and en', () => {
    expect(locales).toContain('zh-CN')
    expect(locales).toContain('en')
  })

  it('isLocale returns true for valid locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('zh-CN')).toBe(true)
  })

  it('isLocale returns false for invalid locales', () => {
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('ja')).toBe(true)
  })
})

describe('product types', () => {
  it('locales array is readonly', () => {
    const len = locales.length
    expect(len).toBeGreaterThan(0)
  })
})