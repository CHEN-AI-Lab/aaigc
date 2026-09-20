// qrcode —— T2（位图生成需要 canvas / npm 库）
// 下沉的是「输入校验 + 渲染参数归一化」；矩阵生成由端侧平台能力完成，
// 端侧据此决定原生实现或 WebView 兜底（架构 §4.1 的 T2 下沉边界）。

import type { ToolContext, ToolDefinition, ToolOutcome } from '../types/tool'
import { toolFail, toolOk, readInt, readString, clampInt } from './common'

export interface QrCodeInput {
  text: string
  width: number
  margin: number
  /** 前景/背景色由主题 CSS 变量决定，这里只接受合法 #rrggbb 覆盖 */
  dark?: string
  light?: string
}

export interface QrCodeOutput {
  text: string
  width: number
  margin: number
  dark: string
  light: string
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

export function parseQrCode(
  raw: Record<string, unknown>,
  _ctx: ToolContext,
): ToolOutcome<QrCodeInput> {
  const text = (readString(raw, 'text') ?? '').trim()
  if (text.length === 0) return toolFail('emptyInput', 'tools.pleaseEnterText')
  if (text.length > 2953) return toolFail('outOfRange', 'tools.outOfRange')

  const dark = readString(raw, 'dark')
  const light = readString(raw, 'light')
  if (dark !== null && !HEX_COLOR_RE.test(dark)) return toolFail('invalidHex', 'tools.invalidHex')
  if (light !== null && !HEX_COLOR_RE.test(light)) return toolFail('invalidHex', 'tools.invalidHex')

  return toolOk({
    text,
    width: clampInt(readInt(raw, 'width', 256), 64, 2048),
    margin: clampInt(readInt(raw, 'margin', 2), 0, 16),
    ...(dark === null ? {} : { dark }),
    ...(light === null ? {} : { light }),
  })
}

export function runQrCode(input: QrCodeInput, _ctx: ToolContext): ToolOutcome<QrCodeOutput> {
  return toolOk({
    text: input.text,
    width: input.width,
    margin: input.margin,
    dark: input.dark ?? '#1f1f1f',
    light: input.light ?? '#ffffff',
  })
}

/** CLI / 小程序纯文本兜底：输出待编码内容本身 */
export function renderQrCode(out: QrCodeOutput, _ctx: ToolContext): string {
  return out.text
}

export const qrCodeTool: ToolDefinition<QrCodeInput, QrCodeOutput> = {
  id: 'qrcode',
  tier: 'T2',
  capabilities: ['canvas'],
  inputs: [
    { name: 'text', kind: 'textarea', required: true, labelKey: 'tools.enterTextOrUrl' },
    { name: 'width', kind: 'number', required: false, labelKey: 'tools.width', default: 256 },
    { name: 'margin', kind: 'number', required: false, labelKey: 'tools.margin', default: 2 },
  ],
  parse: parseQrCode,
  run: runQrCode,
  render: renderQrCode,
}
