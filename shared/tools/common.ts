// ─────────────────────────────────────────────────────────────────────────────
// shared/tools 公共纯函数 —— 不含任何平台 API，可被 esbuild 打成 shared.mjs
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolContext, ToolError, ToolErrorCode, ToolOutcome } from '../types/tool'

// ─── ToolOutcome 构造器 ────────────────────────────────────────────────────

export function toolOk<T>(data: T): ToolOutcome<T> {
  return { ok: true, data }
}

/**
 * 构造失败结果。
 * @param detail 引擎原始报错（可选）。仅作次要文案，不含语言逻辑。
 */
export function toolFail<T>(
  code: ToolErrorCode,
  messageKey: string,
  params?: Record<string, string | number>,
  detail?: string,
): ToolOutcome<T> {
  const error: ToolError = params ? { code, messageKey, params } : { code, messageKey }
  if (detail !== undefined && detail.length > 0) error.detail = detail
  return { ok: false, error }
}

/** 把 catch 到的 unknown 收敛成可展示的 detail 文本（不含语言文案） */
export function errorDetail(caught: unknown): string {
  if (caught instanceof Error) return caught.message
  return typeof caught === 'string' ? caught : ''
}

// ─── 原始输入读取 ──────────────────────────────────────────────────────────

/** 读取必填字符串字段；缺失或空白 → emptyInput */
export function readString(
  raw: Record<string, unknown>,
  name: string,
): string | null {
  const value = raw[name]
  if (typeof value !== 'string') return null
  return value
}

export function requireString(
  raw: Record<string, unknown>,
  name: string,
  messageKey: string,
): { ok: true; value: string } | { ok: false; error: ToolError } {
  const value = readString(raw, name)
  if (value === null || value.trim().length === 0) {
    return { ok: false, error: { code: 'emptyInput', messageKey } }
  }
  return { ok: true, value }
}

export function readInt(
  raw: Record<string, unknown>,
  name: string,
  fallback: number,
): number {
  const value = raw[name]
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function readBool(raw: Record<string, unknown>, name: string, fallback: boolean): boolean {
  const value = raw[name]
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  if (typeof value === 'number') return value !== 0
  return fallback
}

export function readEnum<T extends string>(
  raw: Record<string, unknown>,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = raw[name]
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T
  }
  return fallback
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

// ─── 确定性随机源（经 ToolContext 注入，跨端结果一致） ────────────────────

const RANDOM_CHUNK_SIZE = 256

export class RandomSource {
  private buffer: Uint8Array = new Uint8Array(0)
  private offset = 0

  constructor(private readonly ctx: ToolContext) {}

  /** 下一个字节（0–255） */
  byte(): number {
    if (this.offset >= this.buffer.length) {
      this.buffer = this.ctx.randomBytes(RANDOM_CHUNK_SIZE)
      this.offset = 0
    }
    return this.buffer[this.offset++]
  }

  /** 下一个 uint32 */
  uint32(): number {
    return ((this.byte() << 24) | (this.byte() << 16) | (this.byte() << 8) | this.byte()) >>> 0
  }

  /** [0, bound) 内的均匀整数（拒绝采样，避免取模偏置） */
  below(bound: number): number {
    if (bound <= 0) return 0
    if (bound === 1) return 0
    const limit = Math.floor(0xffffffff / bound) * bound
    for (let attempt = 0; attempt < 64; attempt++) {
      const value = this.uint32()
      if (value < limit) return value % bound
    }
    return this.uint32() % bound
  }

  /** [min, max] 闭区间内的整数 */
  range(min: number, max: number): number {
    if (max <= min) return min
    return min + this.below(max - min + 1)
  }

  /** 从数组中均匀取一个元素 */
  pick<T>(items: readonly T[]): T {
    return items[this.below(items.length)]
  }

  /** Fisher–Yates 洗牌（原地） */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.below(i + 1)
      const tmp = items[i]
      items[i] = items[j]
      items[j] = tmp
    }
    return items
  }
}

// ─── Base64（纯实现，不依赖 btoa/atob，平台中立） ─────────────────────────

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const B64_LOOKUP: Record<string, number> = (() => {
  const table: Record<string, number> = {}
  for (let i = 0; i < B64_ALPHABET.length; i++) table[B64_ALPHABET[i]] = i
  return table
})()

export function utf8Bytes(text: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(text)
}

export function utf8Text(bytes: Uint8Array): string {
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

/** UTF-8 → Base64（与浏览器 btoa(unescape(encodeURIComponent(s))) 等价） */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64_ALPHABET[(n >> 18) & 63]
    out += B64_ALPHABET[(n >> 12) & 63]
    out += B64_ALPHABET[(n >> 6) & 63]
    out += B64_ALPHABET[n & 63]
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += B64_ALPHABET[(n >> 18) & 63]
    out += B64_ALPHABET[(n >> 12) & 63]
    out += '=='
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += B64_ALPHABET[(n >> 18) & 63]
    out += B64_ALPHABET[(n >> 12) & 63]
    out += B64_ALPHABET[(n >> 6) & 63]
    out += '='
  }
  return out
}

export function textToBase64(text: string): string {
  return bytesToBase64(utf8Bytes(text))
}

/** Base64 → UTF-8；非法输入返回 null */
export function base64ToBytes(input: string): Uint8Array | null {
  const clean = input.replace(/[\s=]/g, '')
  if (clean.length === 0) return new Uint8Array(0)
  if (clean.length % 4 === 1) return null
  for (const char of clean) {
    if (B64_LOOKUP[char] === undefined) return null
  }
  const outLength = Math.floor((clean.length * 3) / 4)
  const out = new Uint8Array(outLength)
  let pos = 0
  for (let i = 0; i < clean.length; i += 4) {
    const chunk = clean.slice(i, i + 4)
    let acc = 0
    for (let j = 0; j < 4; j++) {
      acc = (acc << 6) | (B64_LOOKUP[chunk[j]] ?? 0)
    }
    const bytes = [(acc >> 16) & 255, (acc >> 8) & 255, acc & 255]
    for (let j = 0; j < bytes.length && pos < outLength; j++) {
      out[pos++] = bytes[j]
    }
  }
  return out
}

export function base64ToText(input: string): string | null {
  const bytes = base64ToBytes(input)
  if (bytes === null) return null
  return utf8Text(bytes)
}

// ─── 文本小工具 ────────────────────────────────────────────────────────────

export function padNumber(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

/** 与 toLocaleLowerCase 无关的确定性大写（避免 locale 分支） */
export function upperCaseAscii(text: string): string {
  return text.replace(/[a-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 32))
}

export function lowerCaseAscii(text: string): string {
  return text.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32))
}
