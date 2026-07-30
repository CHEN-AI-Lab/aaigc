import { describe, it, expect, beforeAll } from 'vitest'
import { products } from '../../data/products'
import { familyRelations } from '../../data/family'
import type { CategoryInfo, ToolCategoryId } from '../../shared/types'

describe('products', () => {
  it('has 11 products', () => {
    expect(products.length).toBe(11)
  })

  it('each product has required fields', () => {
    for (const p of products) {
      expect(p.id).toBeTruthy()
      expect(typeof p.id).toBe('string')
      expect(p.icon).toBeTruthy()
      expect(p.url !== undefined).toBe(true)
      expect(['live', 'beta', 'wip', 'planned']).toContain(p.status)
    }
  })

  it('each product has unique id', () => {
    const ids = products.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each product has a valid URL when deployed', () => {
    for (const p of products) {
      if (p.url) {
        expect(p.url).toMatch(/^https?:\/\//)
      }
    }
  })

  it('each product has a non-empty icon emoji', () => {
    for (const p of products) {
      expect(p.icon.length).toBeGreaterThan(0)
      expect(p.icon.codePointAt(0)).toBeGreaterThanOrEqual(0x2000)
    }
  })

  it('has at least one live product', () => {
    expect(products.some(p => p.status === 'live')).toBe(true)
  })

  it('has at least one wip product', () => {
    expect(products.some(p => p.status === 'wip')).toBe(true)
  })
})

describe('tools', () => {
  let tools: any[]
  let categories: CategoryInfo[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    tools = mod.tools
    categories = mod.toolCategories
  })

  it('dynamically loads all tools', () => {
    expect(tools.length).toBeGreaterThanOrEqual(1)
  })

  it('each tool has valid category', () => {
    const validCats: ToolCategoryId[] = ['dev', 'text', 'time', 'image', 'convert', 'security', 'math', 'network', 'other']
    for (const t of tools) {
      expect(validCats).toContain(t.category)
      expect(t.id).toBeTruthy()
      expect(typeof t.id).toBe('string')
      expect(t.component).toBeTruthy()
      expect(typeof t.component).toBe('string')
    }
  })

  it('each tool has required fields', () => {
    for (const t of tools) {
      expect(t.id).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.component).toBeTruthy()
      expect(t.icon).toBeTruthy()
      expect(t.icon.length).toBeGreaterThan(0)
    }
  })

  it('each tool has unique id', () => {
    const ids = tools.map((t: any) => t.id)
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
      'timer': 'Timer',
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
      'calculator': 'Calculator',
      'ip-lookup': 'IpLookup',
      'dns-lookup': 'DnsLookup',
      'http-status-codes': 'HttpStatusCodes',
      'user-agent-parser': 'UserAgentParser',
      'random-generator': 'RandomGenerator',
      'cron-builder': 'CronBuilder',
      'emoji-picker': 'EmojiPicker',
      'text-to-binary': 'TextToBinary',
    }
    for (const t of tools) {
      expect(slugToComponent[t.id]).toBe(t.component)
    }
  })

  it('each tool has a valid npmDeps field when present', () => {
    for (const t of tools) {
      if (t.npmDeps) {
        expect(Array.isArray(t.npmDeps)).toBe(true)
        expect(t.npmDeps.length).toBeGreaterThan(0)
      }
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
      Timer: () => import('../../apps/web/src/components/tools/Timer'),
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
      Calculator: () => import('../../apps/web/src/components/tools/Calculator'),
      IpLookup: () => import('../../apps/web/src/components/tools/IpLookup'),
      DnsLookup: () => import('../../apps/web/src/components/tools/DnsLookup'),
      HttpStatusCodes: () => import('../../apps/web/src/components/tools/HttpStatusCodes'),
      UserAgentParser: () => import('../../apps/web/src/components/tools/UserAgentParser'),
      RandomGenerator: () => import('../../apps/web/src/components/tools/RandomGenerator'),
      CronBuilder: () => import('../../apps/web/src/components/tools/CronBuilder'),
      EmojiPicker: () => import('../../apps/web/src/components/tools/EmojiPicker'),
      TextToBinary: () => import('../../apps/web/src/components/tools/TextToBinary'),
    }
    for (const t of tools) {
      const loader = componentMap[t.component]
      expect(loader).toBeDefined()
      const mod = await loader()
      expect(mod.default).toBeDefined()
    }
  })
})

describe('tool categories', () => {
  let categories: CategoryInfo[]

  beforeAll(async () => {
    const mod = await import('../../data/tools')
    categories = mod.toolCategories
  })

  it('has 9 categories', () => {
    expect(categories.length).toBe(9)
  })

  it('each category has required fields', () => {
    for (const c of categories) {
      expect(c.id).toBeTruthy()
      expect(c.icon).toBeTruthy()
      expect(typeof c.order).toBe('number')
      expect(c.icon.length).toBeGreaterThan(0)
    }
  })

  it('every tool belongs to a valid category', async () => {
    const mod = await import('../../data/tools')
    const catIds = mod.toolCategories.map((c: CategoryInfo) => c.id)
    for (const t of mod.tools) {
      expect(catIds).toContain(t.category)
    }
  })

  it('categories have unique orders', () => {
    const orders = categories.map(c => c.order)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('categories are ordered sequentially from 1', () => {
    const orders = categories.map(c => c.order).sort((a, b) => a - b)
    expect(orders[0]).toBe(1)
    expect(orders[orders.length - 1]).toBe(orders.length)
  })
})

describe('family relations', () => {
  it('all relations have a non-empty value', () => {
    for (const [key, value] of Object.entries(familyRelations)) {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    }
  })

  it('self-referential relations (爸爸, 妈妈, etc.) are valid', () => {
    expect(familyRelations['爸爸']).toBe('爸爸')
    expect(familyRelations['妈妈']).toBe('妈妈')
    expect(familyRelations['哥哥']).toBe('哥哥')
    expect(familyRelations['姐姐']).toBe('姐姐')
    expect(familyRelations['弟弟']).toBe('弟弟')
    expect(familyRelations['妹妹']).toBe('妹妹')
    expect(familyRelations['儿子']).toBe('儿子')
    expect(familyRelations['女儿']).toBe('女儿')
    expect(familyRelations['老公']).toBe('老公')
    expect(familyRelations['老婆']).toBe('老婆')
  })

  it('爸爸 side relations are correct', () => {
    expect(familyRelations['爸爸的老婆']).toBe('妈妈')
    expect(familyRelations['爸爸的爸爸']).toBe('爷爷')
    expect(familyRelations['爸爸的妈妈']).toBe('奶奶')
    expect(familyRelations['爸爸的哥哥']).toBe('伯父')
    expect(familyRelations['爸爸的弟弟']).toBe('叔叔')
    expect(familyRelations['爸爸的姐姐']).toBe('姑姑')
    expect(familyRelations['爸爸的妹妹']).toBe('姑姑')
    expect(familyRelations['爸爸的儿子']).toBe('兄弟')
    expect(familyRelations['爸爸的女儿']).toBe('姐妹')
  })

  it('妈妈 side relations are correct', () => {
    expect(familyRelations['妈妈的老公']).toBe('爸爸')
    expect(familyRelations['妈妈的爸爸']).toBe('外公')
    expect(familyRelations['妈妈的妈妈']).toBe('外婆')
    expect(familyRelations['妈妈的哥哥']).toBe('舅舅')
    expect(familyRelations['妈妈的弟弟']).toBe('舅舅')
    expect(familyRelations['妈妈的姐姐']).toBe('姨妈')
    expect(familyRelations['妈妈的妹妹']).toBe('姨妈')
    expect(familyRelations['妈妈的儿子']).toBe('兄弟')
    expect(familyRelations['妈妈的女儿']).toBe('姐妹')
  })

  it('sibling spouse relations are correct', () => {
    expect(familyRelations['哥哥的老婆']).toBe('嫂子')
    expect(familyRelations['弟弟的老婆']).toBe('弟媳')
    expect(familyRelations['姐姐的老公']).toBe('姐夫')
    expect(familyRelations['妹妹的老公']).toBe('妹夫')
  })

  it('sibling self-referential relations are correct', () => {
    const siblings = ['哥哥', '姐姐', '弟弟', '妹妹']
    for (const s of siblings) {
      expect(familyRelations[`${s}的爸爸`]).toBe('爸爸')
      expect(familyRelations[`${s}的妈妈`]).toBe('妈妈')
    }
  })

  it('grandparent spouse relations are correct', () => {
    expect(familyRelations['爷爷的老婆']).toBe('奶奶')
    expect(familyRelations['奶奶的老公']).toBe('爷爷')
    expect(familyRelations['外公的老婆']).toBe('外婆')
    expect(familyRelations['外婆的老公']).toBe('外公')
  })

  it('great-grandparent relations are correct', () => {
    expect(familyRelations['爷爷的爸爸']).toBe('曾祖父')
    expect(familyRelations['爷爷的妈妈']).toBe('曾祖母')
    expect(familyRelations['奶奶的爸爸']).toBe('外曾祖父')
    expect(familyRelations['奶奶的妈妈']).toBe('外曾祖母')
    expect(familyRelations['外公的爸爸']).toBe('曾外祖父')
    expect(familyRelations['外公的妈妈']).toBe('曾外祖母')
    expect(familyRelations['外婆的爸爸']).toBe('曾外祖父')
    expect(familyRelations['外婆的妈妈']).toBe('曾外祖母')
  })

  it('child spouse relations are correct', () => {
    expect(familyRelations['儿子的老婆']).toBe('儿媳')
    expect(familyRelations['女儿的老公']).toBe('女婿')
    expect(familyRelations['儿子的儿子']).toBe('孙子')
    expect(familyRelations['儿子的女儿']).toBe('孙女')
    expect(familyRelations['女儿的儿子']).toBe('外孙')
    expect(familyRelations['女儿的女儿']).toBe('外孙女')
  })

  it('no relation value contains "未收录"', () => {
    for (const [key, value] of Object.entries(familyRelations)) {
      if (value.includes('未收录')) {
        throw new Error(`Relation "${key}" has value "${value}" which contains "未收录"`)
      }
    }
  })

  it('every relation key has a valid value', () => {
    const entries = Object.entries(familyRelations)
    for (const [key, value] of entries) {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    }
  })
})