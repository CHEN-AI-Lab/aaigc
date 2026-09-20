// color-picker —— T1 纯计算：HEX ⇄ RGB ⇄ HSL

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readString, padNumber } from './common'

export interface ColorPickerInput {
  hex: string
}

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export interface ColorPickerOutput {
  hex: string
  rgb: Rgb
  hsl: Hsl
  rgbText: string
  hslText: string
  /** 相对亮度（WCAG），供端侧决定前景色 */
  luminance: number
}

const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

export function normalizeHex(input: string): string | null {
  const value = input.trim()
  if (!HEX_RE.test(value)) return null
  const body = value.replace('#', '')
  if (body.length === 3) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`.toLowerCase()
  }
  return `#${body.toLowerCase()}`
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex)
  if (normalized === null) return null
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

export function rgbToHex(rgb: Rgb): string {
  return `#${padNumber(rgb.r, 2)}${padNumber(rgb.g, 2)}${padNumber(rgb.b, 2)}`
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function parseColorPicker(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<ColorPickerInput> {
  const hex = readString(raw, 'hex')
  if (hex === null || normalizeHex(hex) === null) {
    return toolFail('invalidHex', 'tools.invalidHex')
  }
  return toolOk({ hex })
}

export function runColorPicker(input: ColorPickerInput, _ctx: ToolContext): ToolOutcome<ColorPickerOutput> {
  const hex = normalizeHex(input.hex)
  if (hex === null) return toolFail('invalidHex', 'tools.invalidHex')
  const rgb = hexToRgb(hex)
  if (rgb === null) return toolFail('invalidHex', 'tools.invalidHex')
  const hsl = rgbToHsl(rgb)
  return toolOk({
    hex,
    rgb,
    hsl,
    rgbText: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hslText: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    luminance: (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255,
  })
}

export function renderColorPicker(out: ColorPickerOutput, _ctx: ToolContext): string {
  return [out.hex, out.rgbText, out.hslText].join('\n')
}

export const colorPickerTool: ToolDefinition<ColorPickerInput, ColorPickerOutput> = {
  id: 'color-picker',
  tier: 'T1',
  capabilities: [],
  inputs: [{ name: 'hex', kind: 'color', required: true, labelKey: 'tools.hex', default: '#fa520f' }],
  parse: parseColorPicker,
  run: runColorPicker,
  render: renderColorPicker,
}
