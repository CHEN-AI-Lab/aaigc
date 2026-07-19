import { describe, it, expect, beforeAll } from 'vitest'
import { products } from '../../data/products'
import type { CategoryInfo, ToolCategoryId } from '../../shared/types'

describe('products', () => {
  it('has 4 products', () => {
    expect(products.length).toBe(4)
  })

  it('each product has required fields', () => {
    for (const p of products) {
      expect(p.id).toBeTruthy()
      expect(typeof p.id).toBe('string')
      expect(p.name).toBeTruthy()
      expect(p.nameEn).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.descriptionEn).toBeTruthy()
      expect(p.icon).toBeTruthy()
      expect(p.url).toBeTruthy()
      expect(['live', 'beta', 'wip', 'planned']).toContain(p.status)
      expect(Array.isArray(p.features)).toBe(true)
      expect(Array.isArray(p.featuresEn)).toBe(true)
      expect(p.features.length).toBeGreaterThanOrEqual(1)
      expect(p.features.length).toBe(p.featuresEn.length)
    }
  })

  it('each product has unique id', () => {
    const ids = products.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each product has a valid URL', () => {
    for (const p of products) {
      expect(p.url).toMatch(/^https?:\/\//)
    }
  })
})

describe('tools', () => {
  let tools: import('../../data/tools').ToolMeta[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    tools = mod.tools
  })

  it('has 25 tools', () => {
    expect(tools.length).toBe(25)
  })

  it('each tool has valid category', () => {
    const validCats: ToolCategoryId[] = ['dev', 'text', 'time', 'image', 'convert', 'security', 'math']
    for (const t of tools) {
      expect(validCats).toContain(t.category)
      expect(t.id).toBeTruthy()
      expect(typeof t.id).toBe('string')
      expect(t.component).toBeTruthy()
      expect(typeof t.component).toBe('string')
    }
  })

  it('each tool has bilingual names', () => {
    for (const t of tools) {
      expect(t.name).toBeTruthy()
      expect(t.nameEn).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.descriptionEn).toBeTruthy()
      // Some tools have same name in both languages (e.g. Lorem Ipsum)
      if (t.name !== t.nameEn) {
        // at least some should differ
      }
    }
  })

  it('each tool has unique id', () => {
    const ids = tools.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each tool id matches its component slug pattern', () => {
    const slugToComponent: Record<string, string> = {
      'json-formatter': 'JsonFormatter',
      'regex-tester': 'RegexTester',
      'base64': 'Base64Codec',
      'url-encode': 'UrlEncoder',
      'jwt-decoder': 'JwtDecoder',
      'markdown-preview': 'MarkdownPreview',
      'word-counter': 'WordCounter',
      'text-diff': 'TextDiff',
      'timestamp': 'TimestampConverter',
      'date-calculator': 'DateCalculator',
      'qrcode': 'QrCodeGenerator',
      'color-picker': 'ColorPicker',
      'yaml-json': 'YamlJsonConverter',
      'html-entities': 'HtmlEntities',
      'uuid-generator': 'UuidGenerator',
      'html-preview': 'HtmlPreview',
      'case-converter': 'CaseConverter',
      'lorem-ipsum': 'LoremIpsum',
      'password-generator': 'PasswordGenerator',
      'image-to-base64': 'ImageToBase64',
      'number-base': 'NumberBaseConverter',
      'css-minifier': 'CssMinifier',
      'json-to-csv': 'JsonToCsv',
      'text-to-slug': 'TextToSlug',
      'list-sorter': 'ListSorter',
    }
    for (const t of tools) {
      expect(slugToComponent[t.id]).toBe(t.component)
    }
  })

  it('each tool component can be dynamically imported', async () => {
    const componentMap: Record<string, () => Promise<{ default: unknown }>> = {
      JsonFormatter: () => import('../../apps/web/src/components/tools/JsonFormatter'),
      Base64Codec: () => import('../../apps/web/src/components/tools/Base64Codec'),
      HtmlEntities: () => import('../../apps/web/src/components/tools/HtmlEntities'),
      UrlEncoder: () => import('../../apps/web/src/components/tools/UrlEncoder'),
      YamlJsonConverter: () => import('../../apps/web/src/components/tools/YamlJsonConverter'),
      JwtDecoder: () => import('../../apps/web/src/components/tools/JwtDecoder'),
      WordCounter: () => import('../../apps/web/src/components/tools/WordCounter'),
      ColorPicker: () => import('../../apps/web/src/components/tools/ColorPicker'),
      RegexTester: () => import('../../apps/web/src/components/tools/RegexTester'),
      TextDiff: () => import('../../apps/web/src/components/tools/TextDiff'),
      TimestampConverter: () => import('../../apps/web/src/components/tools/TimestampConverter'),
      DateCalculator: () => import('../../apps/web/src/components/tools/DateCalculator'),
      QrCodeGenerator: () => import('../../apps/web/src/components/tools/QrCodeGenerator'),
      MarkdownPreview: () => import('../../apps/web/src/components/tools/MarkdownPreview'),
      UuidGenerator: () => import('../../apps/web/src/components/tools/UuidGenerator'),
      HtmlPreview: () => import('../../apps/web/src/components/tools/HtmlPreview'),
      CaseConverter: () => import('../../apps/web/src/components/tools/CaseConverter'),
      LoremIpsum: () => import('../../apps/web/src/components/tools/LoremIpsum'),
      PasswordGenerator: () => import('../../apps/web/src/components/tools/PasswordGenerator'),
      ImageToBase64: () => import('../../apps/web/src/components/tools/ImageToBase64'),
      NumberBaseConverter: () => import('../../apps/web/src/components/tools/NumberBaseConverter'),
      CssMinifier: () => import('../../apps/web/src/components/tools/CssMinifier'),
      JsonToCsv: () => import('../../apps/web/src/components/tools/JsonToCsv'),
      TextToSlug: () => import('../../apps/web/src/components/tools/TextToSlug'),
      ListSorter: () => import('../../apps/web/src/components/tools/ListSorter'),
    }
    for (const t of tools) {
      const loader = componentMap[t.component]
      expect(loader).toBeDefined()
      const mod = await loader()
      expect(mod.default).toBeDefined()
      expect(typeof mod.default).toBe('function')
    }
  })
})

describe('tool categories', () => {
  let categories: CategoryInfo[]
  let tools: import('../../data/tools').ToolMeta[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    categories = mod.toolCategories
    tools = mod.tools
  })

  it('has 7 categories', () => {
    expect(categories.length).toBe(7)
  })

  it('each category has bilingual names', () => {
    for (const c of categories) {
      expect(c.name).toBeTruthy()
      expect(c.nameEn).toBeTruthy()
      expect(c.icon).toBeTruthy()
      expect(typeof c.order).toBe('number')
    }
  })

  it('every tool belongs to a valid category', () => {
    const catIds = categories.map(c => c.id)
    for (const t of tools) {
      expect(catIds).toContain(t.category)
    }
  })

  it('categories have unique orders', () => {
    const orders = categories.map(c => c.order)
    expect(new Set(orders).size).toBe(orders.length)
  })
})