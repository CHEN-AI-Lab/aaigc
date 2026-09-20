import { describe, expect, it } from 'vitest'
import type { ToolContext } from 'shared/types/tool'
import {
  base64Tool,
  cssMinifierTool,
  htmlEntitiesTool,
  htmlPreviewTool,
  jsonFormatterTool,
  jsonToCsvTool,
  jwtDecoderTool,
  numberBaseTool,
  regexTesterTool,
  urlEncodeTool,
  uuidGeneratorTool,
  yamlJsonTool,
  escapeHtmlEntities,
  unescapeHtmlEntities,
  parseYaml,
  dumpYaml,
} from 'shared/tools'

function ctx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    locale: 'en',
    timezone: 'UTC',
    now: () => 1700000000000,
    randomBytes: (length: number) => new Uint8Array(length).fill(0x11),
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

describe('json-formatter', () => {
  it('formats with 2-space indent', () => {
    const out = run(jsonFormatterTool, { text: '{"b":1,"a":[1,2]}', mode: 'format', indent: 2 })
    expect(out.ok).toBe(true)
    expect(out.data?.text).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}')
  })

  it('minifies', () => {
    const out = run(jsonFormatterTool, { text: '{ "a" : 1 }', mode: 'minify' })
    expect(out.data?.text).toBe('{"a":1}')
  })

  it('validates without producing text', () => {
    const out = run(jsonFormatterTool, { text: '{"a":1}', mode: 'validate' })
    expect(out.ok).toBe(true)
    expect(out.data?.valid).toBe(true)
    expect(out.data?.text).toBe('')
  })

  it('fails with invalidJson on malformed input', () => {
    const out = run(jsonFormatterTool, { text: '{oops}' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidJson')
  })

  it('fails with emptyInput on blank input', () => {
    const out = run(jsonFormatterTool, { text: '   ' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('emptyInput')
  })
})

describe('base64', () => {
  it('encodes UTF-8 text', () => {
    const out = run(base64Tool, { text: 'Hello 世界', mode: 'encode' })
    expect(out.data?.text).toBe(Buffer.from('Hello 世界', 'utf8').toString('base64'))
  })

  it('round-trips', () => {
    const encoded = run(base64Tool, { text: 'aaigc ✓', mode: 'encode' })
    const decoded = run(base64Tool, { text: encoded.data?.text as string, mode: 'decode' })
    expect(decoded.data?.text).toBe('aaigc ✓')
  })

  it('rejects invalid base64', () => {
    const out = run(base64Tool, { text: '!!!!', mode: 'decode' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidBase64')
  })
})

describe('url-encode', () => {
  it('encodes reserved characters', () => {
    const out = run(urlEncodeTool, { text: 'a b&c', mode: 'encode' })
    expect(out.data?.text).toBe('a%20b%26c')
  })

  it('decodes back', () => {
    const out = run(urlEncodeTool, { text: 'a%20b%26c', mode: 'decode' })
    expect(out.data?.text).toBe('a b&c')
  })

  it('reports invalidUrl on malformed percent escape', () => {
    const out = run(urlEncodeTool, { text: '%E0%A4%A', mode: 'decode' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidUrl')
  })
})

describe('regex-tester', () => {
  it('collects global matches with indices', () => {
    const out = run(regexTesterTool, { pattern: 'a(b+)', flags: 'g', text: 'ab abb a' })
    expect(out.data?.matches).toEqual([
      { index: 0, match: 'ab' },
      { index: 3, match: 'abb' },
    ])
    expect(out.data?.total).toBe(2)
  })

  it('handles zero-width matches without infinite loop', () => {
    const out = run(regexTesterTool, { pattern: 'a*', flags: 'g', text: 'bab' })
    expect(out.ok).toBe(true)
    expect(out.data?.total).toBeGreaterThan(0)
  })

  it('reports invalidRegex', () => {
    const out = run(regexTesterTool, { pattern: '(', flags: 'g', text: 'x' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidRegex')
  })
})

describe('jwt-decoder', () => {
  it('decodes header and payload', () => {
    const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url')
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const out = run(jwtDecoderTool, { token: `${header}.${payload}.sig` })
    expect(out.ok).toBe(true)
    expect(out.data?.algorithm).toBe('HS256')
    expect(JSON.parse(out.data?.payload as string)).toEqual({ sub: '123' })
  })

  it('rejects tokens without three segments', () => {
    const out = run(jwtDecoderTool, { token: 'a.b' })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidJwt')
  })
})

describe('uuid-generator', () => {
  it('produces RFC 4122 v4 uuids deterministically from injected randomness', () => {
    const out = run(uuidGeneratorTool, { count: 3 })
    expect(out.data?.values.length).toBe(3)
    for (const value of out.data?.values ?? []) {
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    }
    expect(out.data?.text).toBe((out.data?.values ?? []).join('\n'))
  })

  it('clamps count to 1..100', () => {
    const parsed = uuidGeneratorTool.parse({ count: 9999 }, ctx())
    expect(parsed.ok && parsed.data.count).toBe(100)
  })
})

describe('html-preview', () => {
  it('wraps fragments into a full document', () => {
    const out = run(htmlPreviewTool, { html: '<h1>hi</h1>' })
    expect(out.data?.isFullDocument).toBe(false)
    expect(out.data?.html).toContain('<!DOCTYPE html>')
    expect(out.data?.html).toContain('<h1>hi</h1>')
  })

  it('leaves full documents untouched', () => {
    const out = run(htmlPreviewTool, { html: '<!DOCTYPE html><html><body>x</body></html>' })
    expect(out.data?.isFullDocument).toBe(true)
  })
})

describe('html-entities', () => {
  it('escapes the five core entities', () => {
    expect(escapeHtmlEntities('<a href="x">A & B\'s</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;A &amp; B&#39;s&lt;/a&gt;',
    )
  })

  it('unescapes named and numeric entities', () => {
    expect(unescapeHtmlEntities('&lt;&amp;&gt;&quot;&#39;&#x41;&nbsp;')).toBe('<&>"\'A ')
  })

  it('leaves unknown entities untouched', () => {
    expect(unescapeHtmlEntities('&notreal;')).toBe('&notreal;')
  })
})

describe('css-minifier', () => {
  it('minifies and reports saved bytes', () => {
    const css = '/* c */\nbody {\n  margin : 0 ;\n  color: #333;\n}'
    const out = run(cssMinifierTool, { css, mode: 'minify' })
    expect(out.data?.css).toBe('body{margin:0;color:#333}')
    expect(out.data?.savedBytes).toBe(css.length - 'body{margin:0;color:#333}'.length)
  })

  it('expands declarations when formatting', () => {
    const out = run(cssMinifierTool, { css: 'a{color:red}', mode: 'format' })
    expect(out.data?.css).toContain('\n')
    expect(out.data?.savedBytes).toBe(0)
  })
})

describe('number-base', () => {
  it('converts decimal to all four bases', () => {
    const out = run(numberBaseTool, { value: '255', fromBase: 10 })
    expect(out.data?.values).toEqual([
      { base: 2, label: 'BIN', value: '11111111' },
      { base: 8, label: 'OCT', value: '377' },
      { base: 10, label: 'DEC', value: '255' },
      { base: 16, label: 'HEX', value: 'FF' },
    ])
  })

  it('parses hex input', () => {
    const out = run(numberBaseTool, { value: 'ff', fromBase: 16 })
    expect(out.data?.decimal).toBe(255)
  })

  it('rejects invalid numbers', () => {
    const out = run(numberBaseTool, { value: 'zz', fromBase: 10 })
    expect(out.ok).toBe(false)
    expect(out.error?.code).toBe('invalidNumber')
  })
})

describe('yaml-json', () => {
  it('parses maps, sequences and nesting', () => {
    const parsed = parseYaml('name: aaigc\nlist:\n  - one\n  - two\nnested:\n  k: v\n')
    expect(parsed).toEqual({ name: 'aaigc', list: ['one', 'two'], nested: { k: 'v' } })
  })

  it('round-trips through dumpYaml', () => {
    const value = { name: 'aaigc', list: ['one', 'two'], nested: { k: 'v' } }
    expect(parseYaml(dumpYaml(value))).toEqual(value)
  })

  it('yaml2json produces pretty JSON', () => {
    const out = run(yamlJsonTool, { text: 'a: 1\n', mode: 'yaml2json' })
    expect(out.data?.text).toBe('{\n  "a": 1\n}')
  })

  it('json2yaml produces block YAML', () => {
    const out = run(yamlJsonTool, { text: '{"a":1,"b":[1,2]}', mode: 'json2yaml' })
    expect(out.data?.text).toContain('a: 1')
    expect(out.data?.text).toContain('b:')
  })

  it('fails with emptyInput on blank input', () => {
    const out = run(yamlJsonTool, { text: '  ' })
    expect(out.error?.code).toBe('emptyInput')
  })
})

describe('json-to-csv', () => {
  it('converts an array of objects to CSV', () => {
    const out = run(jsonToCsvTool, { json: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]' })
    expect(out.data?.csv).toBe('name,age\nAlice,30\nBob,25')
    expect(out.data?.rows).toBe(2)
  })

  it('quotes cells containing commas', () => {
    const out = run(jsonToCsvTool, { json: '[{"a":"x,y"}]' })
    expect(out.data?.csv).toBe('a\n"x,y"')
  })

  it('converts a single object to key/value rows', () => {
    const out = run(jsonToCsvTool, { json: '{"a":1,"b":{"c":2}}' })
    expect(out.data?.csv).toBe('Key,Value\na,1\nb.c,2')
  })

  it('rejects invalid JSON', () => {
    const out = run(jsonToCsvTool, { json: '{bad}' })
    expect(out.error?.code).toBe('invalidJson')
  })
})
