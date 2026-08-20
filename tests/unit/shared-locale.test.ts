import { describe, it, expect } from 'vitest'
import { dt, dateLocale } from '../../shared/utils/locale'

describe('shared/utils/locale dt()', () => {
  it('returns English for en locale', () => {
    expect(dt('en', 'Tools', '工具', 'ツール')).toBe('Tools')
  })

  it('returns Chinese for zh-CN locale', () => {
    expect(dt('zh-CN', 'Tools', '工具', 'ツール')).toBe('工具')
  })

  it('returns Japanese for ja locale when provided', () => {
    expect(dt('ja', 'Tools', '工具', 'ツール')).toBe('ツール')
  })

  it('falls back to English when ja is missing', () => {
    expect(dt('ja', 'Tools', '工具')).toBe('Tools')
  })

  it('falls back to English for unknown locales', () => {
    expect(dt('fr', 'Tools', '工具')).toBe('Tools')
  })
})

describe('shared/utils/locale dateLocale()', () => {
  it('maps ja to ja-JP', () => {
    expect(dateLocale('ja')).toBe('ja-JP')
  })

  it('maps en to en-US', () => {
    expect(dateLocale('en')).toBe('en-US')
  })

  it('maps zh-CN to zh-CN', () => {
    expect(dateLocale('zh-CN')).toBe('zh-CN')
  })

  it('maps unknown locales to zh-CN', () => {
    expect(dateLocale('fr')).toBe('zh-CN')
  })
})