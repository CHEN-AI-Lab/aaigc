// image-to-base64 —— T2（读文件需要 file 能力）
// 下沉的是「字节 → Data URL」这段纯逻辑；端侧负责把 File 读成 Uint8Array 后调用。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, readString, bytesToBase64 } from './common'

export interface ImageToBase64Input {
  bytes: number[]
  mimeType: string
  fileName: string
}

export interface ImageToBase64Output {
  dataUrl: string
  base64: string
  bytes: number
  fileName: string
}

/** 5 MB —— 与既有 Web 端限制一致 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'image/avif',
])

export function guessMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'bmp':
      return 'image/bmp'
    case 'svg':
      return 'image/svg+xml'
    case 'avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}

/** 字节数组 → Data URL（纯函数，Node/浏览器/小程序通用） */
export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`
}

export function parseImageToBase64(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<ImageToBase64Input> {
  const rawBytes = raw.bytes
  if (!Array.isArray(rawBytes)) return toolFail('invalidInput', 'tools.failedToRead')
  const bytes: number[] = []
  for (const item of rawBytes) {
    if (typeof item !== 'number' || item < 0 || item > 255) {
      return toolFail('invalidInput', 'tools.failedToRead')
    }
    bytes.push(item)
  }
  if (bytes.length > MAX_IMAGE_BYTES) return toolFail('outOfRange', 'tools.fileTooLarge')

  const fileName = readString(raw, 'fileName') ?? ''
  const providedMime = readString(raw, 'mimeType')
  const mimeType = providedMime && providedMime.length > 0 ? providedMime : guessMimeType(fileName)
  if (!ALLOWED_MIME.has(mimeType)) return toolFail('invalidInput', 'tools.failedToRead')
  return toolOk({ bytes, mimeType, fileName })
}

export function runImageToBase64(
  input: ImageToBase64Input,
  _ctx: ToolContext,
): ToolOutcome<ImageToBase64Output> {
  const bytes = new Uint8Array(input.bytes)
  const base64 = bytesToBase64(bytes)
  return toolOk({
    dataUrl: `data:${input.mimeType};base64,${base64}`,
    base64,
    bytes: bytes.length,
    fileName: input.fileName,
  })
}

export function renderImageToBase64(out: ImageToBase64Output, _ctx: ToolContext): string {
  return out.dataUrl
}

export const imageToBase64Tool: ToolDefinition<ImageToBase64Input, ImageToBase64Output> = {
  id: 'image-to-base64',
  tier: 'T2',
  capabilities: ['file'],
  inputs: [
    { name: 'bytes', kind: 'file', required: true, labelKey: 'tools.dropImage' },
    { name: 'fileName', kind: 'text', required: false, labelKey: 'tools.fileName' },
    { name: 'mimeType', kind: 'text', required: false, labelKey: 'tools.mimeType' },
  ],
  parse: parseImageToBase64,
  run: runImageToBase64,
  render: renderImageToBase64,
}
