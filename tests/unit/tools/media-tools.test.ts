import { describe, expect, it } from 'vitest'
import type { ToolContext } from 'shared/types/tool'
import {
  colorPickerTool,
  fileRenamerTool,
  imageConverterTool,
  imageEditorTool,
  imageToBase64Tool,
  pdfTool,
  qrCodeTool,
  bytesToDataUrl,
  hexToRgb,
  normalizeHex,
  parsePageRange,
  normalizeRotation,
  scaleDimensions,
  targetFileName,
} from 'shared/tools'

function ctx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    locale: 'en',
    timezone: 'UTC',
    now: () => 1700000000000,
    randomBytes: (length: number) => new Uint8Array(length).fill(9),
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

describe('qrcode', () => {
  it('normalizes render options with theme defaults', () => {
    const out = run(qrCodeTool, { text: 'https://aaigc.test' })
    expect(out.data).toMatchObject({ text: 'https://aaigc.test', width: 256, margin: 2, dark: '#1f1f1f', light: '#ffffff' })
  })

  it('requires non-empty text', () => {
    const out = run(qrCodeTool, { text: '  ' })
    expect(out.error?.code).toBe('emptyInput')
  })

  it('rejects oversized payloads', () => {
    const out = run(qrCodeTool, { text: 'a'.repeat(3000) })
    expect(out.error?.code).toBe('outOfRange')
  })

  it('rejects invalid hex colors', () => {
    const out = run(qrCodeTool, { text: 'x', dark: 'red' })
    expect(out.error?.code).toBe('invalidHex')
  })
})

describe('color-picker', () => {
  it('expands shorthand hex', () => {
    expect(normalizeHex('#f0a')).toBe('#ff00aa')
  })

  it('converts hex to rgb', () => {
    expect(hexToRgb('#fa520f')).toEqual({ r: 250, g: 82, b: 15 })
  })

  it('produces rgb and hsl strings', () => {
    const out = run(colorPickerTool, { hex: '#fa520f' })
    expect(out.data?.rgbText).toBe('rgb(250, 82, 15)')
    expect(out.data?.hslText).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
    expect(out.data?.luminance).toBeGreaterThan(0)
  })

  it('rejects malformed hex', () => {
    const out = run(colorPickerTool, { hex: 'nope' })
    expect(out.error?.code).toBe('invalidHex')
  })
})

describe('image-to-base64', () => {
  it('builds a data URL from bytes', () => {
    expect(bytesToDataUrl(new Uint8Array([1, 2, 3]), 'image/png')).toBe('data:image/png;base64,AQID')
  })

  it('converts uploaded bytes', () => {
    const out = run(imageToBase64Tool, { bytes: [1, 2, 3], mimeType: 'image/png', fileName: 'a.png' })
    expect(out.data?.dataUrl).toBe('data:image/png;base64,AQID')
    expect(out.data?.bytes).toBe(3)
  })

  it('rejects disallowed mime types', () => {
    const out = run(imageToBase64Tool, { bytes: [1], mimeType: 'text/html', fileName: 'a.html' })
    expect(out.error?.code).toBe('invalidInput')
  })

  it('rejects non-array byte input', () => {
    const out = run(imageToBase64Tool, { bytes: 'abc' })
    expect(out.error?.code).toBe('invalidInput')
  })
})

describe('image-converter', () => {
  it('names the target file by format', () => {
    expect(targetFileName('photo.jpg', 'webp')).toBe('photo.webp')
    expect(targetFileName('photo.png', 'jpeg')).toBe('photo.jpg')
  })

  it('ignores quality for lossless png', () => {
    const out = run(imageConverterTool, { fileName: 'a.png', sourceWidth: 100, sourceHeight: 50, targetFormat: 'png', quality: 0.2 })
    expect(out.data?.quality).toBe(1)
  })

  it('scales dimensions', () => {
    expect(scaleDimensions(800, 600, 50)).toEqual({ width: 400, height: 300 })
    const out = run(imageConverterTool, { fileName: 'a.jpg', sourceWidth: 800, sourceHeight: 600, targetFormat: 'jpeg', quality: 80, scalePercent: 50 })
    expect(out.data).toMatchObject({ width: 400, height: 300, mimeType: 'image/jpeg' })
  })

  it('rejects missing source dimensions', () => {
    const out = run(imageConverterTool, { fileName: 'a.png', sourceWidth: 0, sourceHeight: 0 })
    expect(out.error?.code).toBe('invalidInput')
  })
})

describe('image-editor', () => {
  it('swaps dimensions for 90/270 rotations', () => {
    const out = run(imageEditorTool, { width: 1000, height: 800, cropX: 0, cropY: 0, cropWidth: 500, cropHeight: 400, rotation: 90 })
    expect(out.data?.rotation).toBe(90)
    expect(out.data?.outputWidth).toBe(400)
    expect(out.data?.outputHeight).toBe(500)
  })

  it('normalizes arbitrary rotations', () => {
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(200)).toBe(180)
  })

  it('clamps crop boxes inside the canvas', () => {
    const out = run(imageEditorTool, { width: 100, height: 100, cropX: 90, cropY: 90, cropWidth: 500, cropHeight: 500 })
    expect(out.data?.crop).toEqual({ x: 90, y: 90, width: 10, height: 10 })
  })
})

describe('pdf-tool', () => {
  it('parses comma/dash page ranges', () => {
    expect(parsePageRange('1-3,5', 10)).toEqual([0, 1, 2, 4])
  })

  it('supports open ranges', () => {
    expect(parsePageRange('8-', 10)).toEqual([7, 8, 9])
    expect(parsePageRange('-2', 10)).toEqual([0, 1])
  })

  it('returns all pages for an empty range', () => {
    expect(parsePageRange('', 3)).toEqual([0, 1, 2])
  })

  it('rejects out-of-range pages', () => {
    expect(parsePageRange('11', 10)).toBeNull()
    const out = run(pdfTool, { operation: 'extract', pageCount: 10, range: '11' })
    expect(out.error?.code).toBe('outOfRange')
  })

  it('names output per operation', () => {
    const out = run(pdfTool, { operation: 'merge', pageCount: 3, range: '', fileName: 'doc.pdf' })
    // 命名已与 Web 端生产行为对齐：`<base>_merged.pdf`
    expect(out.data?.outputFileName).toBe('doc_merged.pdf')
  })
})

describe('file-renamer', () => {
  it('applies prefix rules to a file list', () => {
    const out = run(fileRenamerTool, {
      files: [
        { name: 'IMG_1.jpg', path: 'a/IMG_1.jpg' },
        { name: 'IMG_2.jpg', path: 'a/IMG_2.jpg' },
      ],
      rules: [{ type: 'prefix', text: 'vacation-' }],
    })
    expect(out.data?.changed).toBe(2)
    expect(out.data?.items.map((item) => item.newName)).toEqual(['vacation-IMG_1.jpg', 'vacation-IMG_2.jpg'])
  })

  it('requires a non-empty file list', () => {
    const out = run(fileRenamerTool, { files: [] })
    expect(out.error?.code).toBe('emptyInput')
  })

  it('rejects malformed file entries', () => {
    const out = run(fileRenamerTool, { files: [{ name: 'a.jpg' }] })
    expect(out.error?.code).toBe('invalidInput')
  })
})
