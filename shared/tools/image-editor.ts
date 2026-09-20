// image-editor —— T2（像素处理需要 canvas）
// 下沉的是「裁剪 / 缩放 / 旋转 参数归一化」这段纯逻辑，端侧据此驱动 canvas。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, clampInt } from './common'

export interface ImageEditorInput {
  width: number
  height: number
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
  rotation: number
  scalePercent: number
  flipX: boolean
  flipY: boolean
}

export interface ImageEditorOutput {
  crop: { x: number; y: number; width: number; height: number }
  rotation: number
  scalePercent: number
  flipX: boolean
  flipY: boolean
  /** 旋转 90/270 度后宽高互换 */
  outputWidth: number
  outputHeight: number
}

const ALLOWED_ROTATIONS: readonly number[] = [0, 90, 180, 270]

export function normalizeRotation(rotation: number): number {
  const normalized = ((rotation % 360) + 360) % 360
  const index = Math.round(normalized / 90) % 4
  return ALLOWED_ROTATIONS[index]
}

/** 把裁剪框收敛到画布内 */
export function clampCrop(
  crop: { x: number; y: number; width: number; height: number },
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const x = clampInt(crop.x, 0, Math.max(0, width - 1))
  const y = clampInt(crop.y, 0, Math.max(0, height - 1))
  const w = clampInt(crop.width, 1, Math.max(1, width - x))
  const h = clampInt(crop.height, 1, Math.max(1, height - y))
  return { x, y, width: w, height: h }
}

export function parseImageEditor(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<ImageEditorInput> {
  const width = readInt(raw, 'width', 0)
  const height = readInt(raw, 'height', 0)
  if (width <= 0 || height <= 0) return toolFail('invalidInput', 'tools.invalidInput')
  return toolOk({
    width,
    height,
    cropX: clampInt(readInt(raw, 'cropX', 0), 0, width),
    cropY: clampInt(readInt(raw, 'cropY', 0), 0, height),
    cropWidth: clampInt(readInt(raw, 'cropWidth', width), 1, width),
    cropHeight: clampInt(readInt(raw, 'cropHeight', height), 1, height),
    rotation: readInt(raw, 'rotation', 0),
    scalePercent: clampInt(readInt(raw, 'scalePercent', 100), 1, 400),
    flipX: raw.flipX === true,
    flipY: raw.flipY === true,
  })
}

export function runImageEditor(input: ImageEditorInput, _ctx: ToolContext): ToolOutcome<ImageEditorOutput> {
  const crop = clampCrop(
    { x: input.cropX, y: input.cropY, width: input.cropWidth, height: input.cropHeight },
    input.width,
    input.height,
  )
  const rotation = normalizeRotation(input.rotation)
  const swap = rotation === 90 || rotation === 270
  const factor = input.scalePercent / 100
  return toolOk({
    crop,
    rotation,
    scalePercent: input.scalePercent,
    flipX: input.flipX,
    flipY: input.flipY,
    outputWidth: Math.max(1, Math.round((swap ? crop.height : crop.width) * factor)),
    outputHeight: Math.max(1, Math.round((swap ? crop.width : crop.height) * factor)),
  })
}

export function renderImageEditor(out: ImageEditorOutput, _ctx: ToolContext): string {
  return [
    `crop\t${out.crop.x},${out.crop.y} ${out.crop.width}x${out.crop.height}`,
    `rotate\t${out.rotation}`,
    `scale\t${out.scalePercent}%`,
    `flip\t${out.flipX ? 'X' : '-'}${out.flipY ? 'Y' : '-'}`,
    `output\t${out.outputWidth}x${out.outputHeight}`,
  ].join('\n')
}

export const imageEditorTool: ToolDefinition<ImageEditorInput, ImageEditorOutput> = {
  id: 'image-editor',
  tier: 'T2',
  capabilities: ['canvas', 'file'],
  inputs: [
    { name: 'width', kind: 'number', required: true, labelKey: 'tools.width' },
    { name: 'height', kind: 'number', required: true, labelKey: 'tools.height' },
    { name: 'cropX', kind: 'number', required: false, labelKey: 'tools.cropX', default: 0 },
    { name: 'cropY', kind: 'number', required: false, labelKey: 'tools.cropY', default: 0 },
    { name: 'cropWidth', kind: 'number', required: false, labelKey: 'tools.cropWidth', default: 0 },
    { name: 'cropHeight', kind: 'number', required: false, labelKey: 'tools.cropHeight', default: 0 },
    {
      name: 'rotation',
      kind: 'select',
      required: false,
      labelKey: 'tools.rotation',
      default: 0,
      options: [
        { value: '0', labelKey: 'tools.rotate0' },
        { value: '90', labelKey: 'tools.rotate90' },
        { value: '180', labelKey: 'tools.rotate180' },
        { value: '270', labelKey: 'tools.rotate270' },
      ],
    },
    { name: 'scalePercent', kind: 'number', required: false, labelKey: 'tools.scale', default: 100 },
    { name: 'flipX', kind: 'boolean', required: false, labelKey: 'tools.flipX', default: false },
    { name: 'flipY', kind: 'boolean', required: false, labelKey: 'tools.flipY', default: false },
  ],
  parse: parseImageEditor,
  run: runImageEditor,
  render: renderImageEditor,
}
