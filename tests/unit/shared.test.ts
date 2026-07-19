import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, isLocale } from '../../shared/constants/locales'
import { Product } from '../../shared/types'

describe('locales', () => {
  it('has default locale set to en', () => {
    expect(defaultLocale).toBe('en')
  })

  it('has both zh-CN and en', () => {
    expect(locales).toContain('zh-CN')
    expect(locales).toContain('en')
  })

  it('has ja locale', () => {
    expect(locales).toContain('ja')
  })

  it('isLocale returns true for valid locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('zh-CN')).toBe(true)
    expect(isLocale('ja')).toBe(true)
  })

  it('isLocale returns false for invalid locales', () => {
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('de')).toBe(false)
    expect(isLocale('')).toBe(false)
  })

  it('locales array is readonly', () => {
    const len = locales.length
    expect(len).toBeGreaterThan(0)
  })
})

describe('translation files', () => {
  it('all translation files have matching key structures', async () => {
    const en = await import('../../shared/messages/en.json')
    const zh = await import('../../shared/messages/zh-CN.json')
    const ja = await import('../../shared/messages/ja.json')
    const enKeys = Object.keys(en).sort()
    const zhKeys = Object.keys(zh).sort()
    const jaKeys = Object.keys(ja).sort()
    expect(zhKeys).toEqual(enKeys)
    expect(jaKeys).toEqual(enKeys)
  })

  it('each translation section has the same keys across languages', async () => {
    const en = await import('../../shared/messages/en.json') as Record<string, Record<string, unknown>>
    const zh = await import('../../shared/messages/zh-CN.json') as Record<string, Record<string, unknown>>
    const ja = await import('../../shared/messages/ja.json') as Record<string, Record<string, unknown>>
    const sections = Object.keys(en)
    for (const section of sections) {
      const enKeys = Object.keys(en[section] || {}).sort()
      const zhKeys = Object.keys(zh[section] || {}).sort()
      const jaKeys = Object.keys(ja[section] || {}).sort()
      expect(zhKeys).toEqual(enKeys)
      expect(jaKeys).toEqual(enKeys)
    }
  })
})

describe('types', () => {
  it('Product type has required fields', () => {
    const p: Product = { id: 'test', icon: '🔧', status: 'live', url: 'https://test.com' }
    expect(p.id).toBe('test')
    expect(p.icon).toBe('🔧')
    expect(p.status).toBe('live')
  })

  it('Product type allows optional url', () => {
    const p: Product = { id: 'test', icon: '🔧', status: 'wip' }
    expect(p.url).toBeUndefined()
  })
})