import { describe, expect, it } from 'vitest'
import type { ToolContext } from 'shared/types/tool'
import {
  caseConverterTool,
  loremIpsumTool,
  listSorterTool,
  markdownPreviewTool,
  passwordGeneratorTool,
  textDiffTool,
  textToSlugTool,
  wordCounterTool,
  diffLines,
  markdownToHtml,
} from 'shared/tools'

function ctx(overrides: Partial<ToolContext> = {}): ToolContext {
  let counter = 0
  return {
    locale: 'en',
    timezone: 'UTC',
    now: () => 1700000000000,
    randomBytes: (length: number) => {
      const out = new Uint8Array(length)
      for (let i = 0; i < length; i++) out[i] = (counter = (counter + 37) % 256)
      return out
    },
    ...overrides,
  }
}

function run<I, O>(
  tool: { parse: (r: Record<string, unknown>, c: ToolContext) => { ok: boolean; data?: I; error?: { code: string } }; run: (i: I, c: ToolContext) => { ok: boolean; data?: O; error?: { code: string } } },
  raw: Record<string, unknown>,
): { ok: boolean; data?: O; error?: { code: string } } {
  const parsed = tool.parse(raw, ctx())
  if (!parsed.ok) return { ok: false, error: parsed.error }
  return tool.run(parsed.data as I, ctx())
}

describe('word-counter', () => {
  it('counts characters, words, lines and CJK', () => {
    const out = run(wordCounterTool, { text: 'Hello 世界 world\nsecond' })
    expect(out.data).toEqual({
      chars: 'Hello 世界 world\nsecond'.length,
      charsNoSpace: 'Hello 世界 world\nsecond'.replace(/\s/g, '').length,
      words: 4,
      lines: 2,
      cjk: 2,
    })
  })

  it('reports zero for empty text', () => {
    const out = run(wordCounterTool, { text: '' })
    expect(out.data).toEqual({ chars: 0, charsNoSpace: 0, words: 0, lines: 0, cjk: 0 })
  })
})

describe('markdown-preview', () => {
  it('renders headings, bold, inline code and lists', () => {
    const html = markdownToHtml('# Title\n\nSome **bold** and `code`.\n\n- a\n- b\n')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('</ul>')
  })

  it('escapes raw HTML so output is injection-safe', () => {
    const html = markdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders fenced code blocks', () => {
    const html = markdownToHtml('```js\nconst a = 1\n```')
    expect(html).toContain('<pre><code')
    expect(html).toContain('const a = 1')
  })

  it('counts words', () => {
    const out = run(markdownPreviewTool, { markdown: '# a b c' })
    expect(out.data?.words).toBe(4)
  })
})

describe('case-converter', () => {
  it.each([
    ['upper', 'HELLO WORLD'],
    ['lower', 'hello world'],
    ['title', 'Hello World'],
    ['camel', 'helloWorld'],
    ['snake', 'hello_world'],
  ] as const)('converts to %s', (style, expected) => {
    const out = run(caseConverterTool, { text: 'hello world', style })
    expect(out.data?.text).toBe(expected)
  })
})

describe('text-diff', () => {
  it('detects modified lines', () => {
    const parts = diffLines('a\nb\nc\n', 'a\nB\nc\n')
    expect(parts.some((p) => p.type === 'removed' && p.value === 'b\n')).toBe(true)
    expect(parts.some((p) => p.type === 'added' && p.value === 'B\n')).toBe(true)
  })

  it('reports added/removed counts', () => {
    const out = run(textDiffTool, { left: 'a\nb\n', right: 'a\n' })
    expect(out.data?.removedLines).toBe(1)
    expect(out.data?.addedLines).toBe(0)
  })

  it('is a no-op for identical input', () => {
    const out = run(textDiffTool, { left: 'x\ny\n', right: 'x\ny\n' })
    expect(out.data?.parts.every((p) => p.type === 'equal')).toBe(true)
  })
})

describe('lorem-ipsum', () => {
  it('generates the requested number of sentences', () => {
    const out = run(loremIpsumTool, { count: 3, unit: 'sentences' })
    expect(out.data?.text.split('. ').length).toBe(3)
    expect(out.data?.text.endsWith('.')).toBe(true)
  })

  it('is deterministic for the same injected random source', () => {
    const a = run(loremIpsumTool, { count: 2, unit: 'words' })
    const b = run(loremIpsumTool, { count: 2, unit: 'words' })
    expect(a.data?.text).toBe(b.data?.text)
  })

  it('clamps count to 1..100', () => {
    const parsed = loremIpsumTool.parse({ count: 500, unit: 'words' }, ctx())
    expect(parsed.ok && parsed.data.count).toBe(100)
  })
})

describe('text-to-slug', () => {
  it('slugifies punctuation and whitespace', () => {
    const out = run(textToSlugTool, { text: '  Hello, World! -- 2024  ' })
    expect(out.data?.slug).toBe('hello-world-2024')
  })

  it('collapses repeated dashes', () => {
    const out = run(textToSlugTool, { text: 'a___b' })
    expect(out.data?.slug).toBe('a-b')
  })
})

describe('list-sorter', () => {
  it('sorts ascending and descending', () => {
    expect(run(listSorterTool, { text: 'b\na\nc', mode: 'asc' }).data?.text).toBe('a\nb\nc')
    expect(run(listSorterTool, { text: 'b\na\nc', mode: 'desc' }).data?.text).toBe('c\nb\na')
  })

  it('deduplicates', () => {
    expect(run(listSorterTool, { text: 'b\na\nb', mode: 'unique' }).data?.text).toBe('b\na')
  })

  it('shuffles deterministically with injected randomness', () => {
    const a = run(listSorterTool, { text: '1\n2\n3\n4\n5', mode: 'shuffle' })
    const b = run(listSorterTool, { text: '1\n2\n3\n4\n5', mode: 'shuffle' })
    expect(a.data?.text).toBe(b.data?.text)
    expect(a.data?.text.split('\n').sort()).toEqual(['1', '2', '3', '4', '5'])
  })
})

describe('password-generator', () => {
  it('honours length and charset flags', () => {
    const out = run(passwordGeneratorTool, { length: 12, upper: false, lower: true, digits: false, symbols: false })
    expect(out.data?.password).toHaveLength(12)
    expect(out.data?.password).toMatch(/^[a-z]{12}$/)
    expect(out.data?.poolSize).toBe(26)
  })

  it('scores strength', () => {
    const weak = run(passwordGeneratorTool, { length: 6, upper: true, lower: true, digits: false, symbols: false })
    const strong = run(passwordGeneratorTool, { length: 20, upper: true, lower: true, digits: true, symbols: true })
    expect(strong.data?.strength).toBeGreaterThan(weak.data?.strength ?? 0)
    expect(strong.data?.strength).toBe(100)
  })

  it('fails when no charset is selected', () => {
    const out = run(passwordGeneratorTool, { length: 8, upper: false, lower: false, digits: false, symbols: false })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidInput')
  })
})
