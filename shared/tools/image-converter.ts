// image-converter —— T2（像素处理需要 canvas）
// 下沉的是「目标格式协商 + 输出尺寸计算」这段纯逻辑。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readEnum, readInt, readString, clampInt } from './common'

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'bmp' | 'gif'

export interface ImageConverterInput {
  fileName: string
  sourceWidth: number
  sourceHeight: number
  targetFormat: ImageFormat
  quality: number
  scalePercent: number
}

export interface ImageConverterOutput {
  fileName: string
  mimeType: string
  width: number
  height: number
  quality: number
}

const FORMATS: readonly ImageFormat[] = ['png', 'jpeg', 'webp', 'bmp', 'gif']

export const IMAGE_MIME: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
  gif: 'image/gif',
}

/** 无损格式（quality 无意义） */
export const LOSSLESS_FORMATS: readonly ImageFormat[] = ['png', 'bmp', 'gif']

/**
 * 替换/追加扩展名。
 * @param size 传入时追加 `_<w>x<h>` 尺寸后缀（与既有 Web 产物命名一致）
 */
export function targetFileName(
  sourceName: string,
  format: ImageFormat,
  size?: { width: number; height: number },
): string {
  const dot = sourceName.lastIndexOf('.')
  const base = dot > 0 ? sourceName.slice(0, dot) : sourceName
  const ext = format === 'jpeg' ? 'jpg' : format
  const suffix =
    size && size.width > 0 && size.height > 0 ? `_${size.width}x${size.height}` : ''
  return `${base}${suffix}.${ext}`
}

/** 无损格式 → 忽略 quality；有损格式 quality ∈ [0.1, 1] */
export function normalizeQuality(format: ImageFormat, quality: number): number {
  if (LOSSLESS_FORMATS.includes(format)) return 1
  return Math.min(1, Math.max(0.1, quality))
}

export function scaleDimensions(
  width: number,
  height: number,
  scalePercent: number,
): { width: number; height: number } {
  const factor = scalePercent / 100
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  }
}

/**
 * 按绝对像素计算输出尺寸（与既有 Web 行为一致：不保持宽高比，直接用目标值）。
 * targetWidth / targetHeight 非正时回退为原尺寸。
 */
export function scaleToAbsolute(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
): { width: number; height: number } {
  if (targetWidth <= 0 || targetHeight <= 0) {
    return { width: Math.max(1, Math.trunc(width)), height: Math.max(1, Math.trunc(height)) }
  }
  return {
    width: Math.max(1, Math.trunc(targetWidth)),
    height: Math.max(1, Math.trunc(targetHeight)),
  }
}

export function parseImageConverter(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<ImageConverterInput> {
  const sourceWidth = readInt(raw, 'sourceWidth', 0)
  const sourceHeight = readInt(raw, 'sourceHeight', 0)
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return toolFail('invalidInput', 'tools.invalidInput')
  }
  return toolOk({
    fileName: readString(raw, 'fileName') ?? 'image',
    sourceWidth,
    sourceHeight,
    targetFormat: readEnum(raw, 'targetFormat', FORMATS, 'png'),
    quality: clampInt(readInt(raw, 'quality', 90), 1, 100) / 100,
    scalePercent: clampInt(readInt(raw, 'scalePercent', 100), 1, 400),
  })
}

export function runImageConverter(
  input: ImageConverterInput,
  _ctx: ToolContext,
): ToolOutcome<ImageConverterOutput> {
  const { width, height } = scaleDimensions(input.sourceWidth, input.sourceHeight, input.scalePercent)
  return toolOk({
    fileName: targetFileName(input.fileName, input.targetFormat),
    mimeType: IMAGE_MIME[input.targetFormat],
    width,
    height,
    quality: normalizeQuality(input.targetFormat, input.quality),
  })
}

export function renderImageConverter(out: ImageConverterOutput, _ctx: ToolContext): string {
  return `${out.fileName}\t${out.mimeType}\t${out.width}x${out.height}\tq=${out.quality}`
}

export const imageConverterTool: ToolDefinition<ImageConverterInput, ImageConverterOutput> = {
  id: 'image-converter',
  tier: 'T2',
  capabilities: ['canvas', 'file'],
  inputs: [
    { name: 'fileName', kind: 'text', required: true, labelKey: 'tools.fileName' },
    { name: 'sourceWidth', kind: 'number', required: true, labelKey: 'tools.width' },
    { name: 'sourceHeight', kind: 'number', required: true, labelKey: 'tools.height' },
    {
      name: 'targetFormat',
      kind: 'select',
      required: false,
      labelKey: 'tools.format',
      default: 'png',
      options: [
        { value: 'png', labelKey: 'tools.formatPng' },
        { value: 'jpeg', labelKey: 'tools.formatJpeg' },
        { value: 'webp', labelKey: 'tools.formatWebp' },
      ],
    },
    { name: 'quality', kind: 'number', required: false, labelKey: 'tools.quality', default: 90 },
    { name: 'scalePercent', kind: 'number', required: false, labelKey: 'tools.scale', default: 100 },
  ],
  parse: parseImageConverter,
  run: runImageConverter,
  render: renderImageConverter,
}
