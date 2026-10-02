// shared/constants/locales.test.ts —— 4 语言核心常量测试
//
// 跨端契约：所有端（web/weapp/app/desktop/cli/harmony）import 这份常量，
// 不允许任何端"私自"加语言、改 defaultLocale 或重命名。

import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, isLocale, localeNames } from 'shared/constants/locales'

describe('locales', () => {
  it('exactly 4 locales in correct order (en, zh-CN, zh-TW, ja)', () => {
    expect(locales).toEqual(['en', 'zh-CN', 'zh-TW', 'ja'] as const)
  })

  it('all locales are unique', () => {
    expect(new Set(locales).size).toBe(locales.length)
  })

  it('locale codes match canonical BCP 47-ish format', () => {
    for (const loc of locales) {
      // en / zh-CN / zh-TW / ja —— 不允许大写语言子标签
      expect(loc).toMatch(/^[a-z]{2,3}(-[A-Z]{2,3})?$/)
    }
  })
})

describe('defaultLocale', () => {
  it('is "en"', () => {
    expect(defaultLocale).toBe('en')
  })

  it('is a member of locales[]', () => {
    expect(locales).toContain(defaultLocale)
  })
})

describe('isLocale', () => {
  it('returns true for each of the 4 locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('zh-CN')).toBe(true)
    expect(isLocale('zh-TW')).toBe(true)
    expect(isLocale('ja')).toBe(true)
  })

  it('returns false for unknown locales', () => {
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('zh')).toBe(false) // 没地区
    expect(isLocale('EN')).toBe(false) // 大写严格匹配
    expect(isLocale('zh-cn')).toBe(false) // 小写地区严格匹配
    expect(isLocale('')).toBe(false)
    expect(isLocale('xx-YY')).toBe(false)
  })

  it('is a type guard usable in conditional branches', () => {
    const input: string = 'zh-CN'
    if (isLocale(input)) {
      // 编译期：这里 input 是 Locale 类型
      const typed: 'en' | 'zh-CN' | 'zh-TW' | 'ja' = input
      expect(typed).toBe('zh-CN')
    } else {
      throw new Error('should not reach here')
    }
  })
})

describe('localeNames', () => {
  it('has a native name for every locale', () => {
    for (const loc of locales) {
      expect(localeNames[loc]).toBeTruthy()
      expect(localeNames[loc].length).toBeGreaterThan(0)
    }
  })

  it('uses native script (Japanese not romaji, Chinese not pinyin)', () => {
    expect(localeNames.ja).toBe('日本語') // 不能是 "Nihongo"
    expect(localeNames['zh-CN']).toBe('简体中文')
    expect(localeNames['zh-TW']).toBe('繁體中文') // 繁体字
    expect(localeNames.en).toBe('English')
  })

  it('zh-CN and zh-TW labels are visually distinct (not identical)', () => {
    expect(localeNames['zh-CN']).not.toBe(localeNames['zh-TW'])
  })

  it('has no missing keys', () => {
    expect(Object.keys(localeNames).sort()).toEqual([...locales].sort())
  })
})

describe('cross-end invariants', () => {
  it('locales[] length equals localeNames key count (5 端都依赖此对应)', () => {
    expect(Object.keys(localeNames).length).toBe(locales.length)
  })

  it('defaultLocale has a native name', () => {
    expect(localeNames[defaultLocale]).toBeTruthy()
  })
})
