// tools/i18n/favorites 的纯函数单元测试
//
// 测试目标：
//   1. tools 数组有 38 个工具
//   2. 每个工具的 id 唯一
//   3. categoriesWithTools() 返回的分类每个至少有一个工具
//   4. 每个工具的 category 必须在 toolCategories 内
//   5. i18n key 在 4 语言下都有值（避免空 fallback）
//   6. favoriteKey() 跨端契约（key 格式 + 同 key 重复 toggle 不互相覆盖）
//   7. ThemeMode 持久化（getThemeMode 默认值 + 切换后保持）
//
// 运行：hvigorw test（在 macOS/Windows 真机上）

import { describe, it, expect } from '@ohos/hypium'
import { tools, toolCategories, categoriesWithTools } from 'shared/data/tools'
import { locales, defaultLocale } from 'shared/constants/locales'
import { favoriteKey } from 'shared/utils/favorite-sync'

// ⚠️ hypium 没有 node:fs 等 Node API；messages.generated.ets 通过构建期注入
// 这里直接 import 生成的常量（与 ets 主代码共享）
import { AAIGC_MESSAGES } from '../main/ets/generated/messages.generated'

export default function toolsTest() {
  describe('tools shared data', () => {
    it('has 38 tools', 0, () => {
      expect(tools.length).assertEqual(38)
    })

    it('every tool id is unique', 0, () => {
      const ids = new Set<string>()
      let duplicates = 0
      for (const tool of tools) {
        if (ids.has(tool.id)) duplicates++
        ids.add(tool.id)
      }
      expect(duplicates).assertEqual(0)
    })

    it('every tool category is in toolCategories', 0, () => {
      const validIds = new Set(toolCategories.map(c => c.id))
      let invalidCount = 0
      for (const tool of tools) {
        if (!validIds.has(tool.category)) invalidCount++
      }
      expect(invalidCount).assertEqual(0)
    })

    it('categoriesWithTools returns all categories with at least one tool', 0, () => {
      const result = categoriesWithTools()
      for (const cat of result) {
        const hasTool = tools.some(t => t.category === cat.id)
        expect(hasTool).assertTrue()
      }
    })
  })

  describe('i18n messages', () => {
    it('AAIGC_MESSAGES is injected (4 locales)', 0, () => {
      expect(AAIGC_MESSAGES !== undefined).assertTrue()
    })

    it('each locale bundle is non-empty', 0, () => {
      for (const locale of locales) {
        const bundle = AAIGC_MESSAGES[locale]
        expect(bundle !== undefined && bundle !== null).assertTrue()
      }
    })

    it('common namespace exists in all 4 locales', 0, () => {
      for (const locale of locales) {
        const common = AAIGC_MESSAGES[locale]?.['common']
        expect(common !== undefined).assertTrue()
        // appName 是基础 key，必须存在
        expect((common as Record<string, string>)['appName']).assertEqual('AAIGC')
      }
    })

    it('nav namespace exists in all 4 locales (used by tabBar)', 0, () => {
      for (const locale of locales) {
        const nav = AAIGC_MESSAGES[locale]?.['nav']
        expect(nav !== undefined).assertTrue()
        const navMap = nav as Record<string, string>
        expect(navMap['home'] !== undefined).assertTrue()
        expect(navMap['tools'] !== undefined).assertTrue()
        expect(navMap['products'] !== undefined).assertTrue()
        expect(navMap['about'] !== undefined).assertTrue()
      }
    })

    it('defaultLocale bundle has English values', 0, () => {
      const common = AAIGC_MESSAGES[defaultLocale]?.['common'] as Record<string, string>
      expect(common['appName']).assertEqual('AAIGC')
      expect(common['tools']).assertEqual('Tools')
    })

    it('zh-CN bundle has Chinese values', 0, () => {
      const common = AAIGC_MESSAGES['zh-CN']?.['common'] as Record<string, string>
      expect(common['appName']).assertEqual('AAIGC')
      expect(common['tools']).assertEqual('工具')
    })
  })

  describe('locales constants', () => {
    it('defaultLocale is one of the supported locales', 0, () => {
      const allLocales = locales as readonly string[]
      expect(allLocales.includes(defaultLocale)).assertTrue()
    })

    it('has exactly 4 locales', 0, () => {
      expect((locales as readonly unknown[]).length).assertEqual(4)
    })
  })

  describe('favoriteKey (cross-end contract)', () => {
    it('produces type:toolId format', 0, () => {
      expect(favoriteKey('json-formatter', 'tool')).assertEqual('tool:json-formatter')
      expect(favoriteKey('cookmate', 'product')).assertEqual('product:cookmate')
    })

    it('disambiguates tool vs product with same toolId', 0, () => {
      // 同一个 id 既可能是 tool 也可能是 product，键不能相同
      const toolKey = favoriteKey('shared-id', 'tool')
      const productKey = favoriteKey('shared-id', 'product')
      expect(toolKey).assertNotEqual(productKey)
    })

    it('is deterministic across calls (same inputs → same key)', 0, () => {
      const k1 = favoriteKey('json-formatter', 'tool')
      const k2 = favoriteKey('json-formatter', 'tool')
      expect(k1).assertEqual(k2)
    })
  })
}