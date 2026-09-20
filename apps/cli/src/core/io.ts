// ─────────────────────────────────────────────────────────────────────────────
// 输出契约的唯一实现点
//
//   正常数据 → stdout
//   错误与诊断 → stderr
//   --json   → stdout 只有一个可解析的 JSON 文档，绝不混入装饰文字
//   非 TTY   → 自动关闭颜色 / 进度行 / 表格边框
//
// 所有写操作都收在这里，避免某个命令顺手 console.log 把 stdout 弄脏。
// ─────────────────────────────────────────────────────────────────────────────

import { paint } from '../format/ansi'
import { renderJson } from '../format/json'
import { displayWidth } from '../format/width'
import { CLI_ERROR_CODES, type CliError } from './errors'
import type { CliExitCode } from './exit-codes'
import type { Translator } from './i18n'

export interface IoOptions {
  json: boolean
  color: boolean
  stdoutIsTty: boolean
  stderrIsTty: boolean
  translator: Translator
}

export interface Io {
  readonly json: boolean
  readonly color: boolean
  readonly stdoutIsTty: boolean
  readonly stderrIsTty: boolean
  /** 正常数据 → stdout */
  write(text: string): void
  /** 机器可解析 JSON → stdout（无任何装饰） */
  writeJson(value: unknown): void
  /** 诊断 / 提示 → stderr */
  diag(text: string): void
  warn(text: string): void
  /** 单行进度：仅 stderr 为 TTY 且非 --json 时输出，重复调用原地覆盖 */
  progress(text: string): void
  clearProgress(): void
  /** 错误 → stderr（--json 输出 JSON 错误体，否则人读文本），返回其退出码 */
  reportError(error: CliError): CliExitCode
  accent(text: string): string
  dim(text: string): string
}

/**
 * CLI 本地错误码 → shared/messages 的 `cli.err*` key。
 * 码 `cliUsage` / `cliConfigMissing` 去掉 `cli` 前缀，拼成
 * `cli.errUsage` / `cli.errConfigMissing`。
 */
function cliErrorKey(code: string): string {
  const suffix = code.startsWith('cli') ? code.slice(3) : code
  return `cli.err${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`
}

/** 错误码 → 文案：工具错误带 messageKey；API 错误码走 errors.*；本地码走 cli.err* */
function errorMessage(translator: Translator, error: CliError): string {
  if (error.messageKey) return translator.t(error.messageKey, error.params)
  if ((CLI_ERROR_CODES as readonly string[]).includes(error.code)) {
    return translator.t(cliErrorKey(error.code), error.params)
  }
  return translator.t(`errors.${error.code}`, error.params)
}

export function createIo(options: IoOptions): Io {
  const { translator } = options
  let progressLength = 0

  return {
    json: options.json,
    color: options.color,
    stdoutIsTty: options.stdoutIsTty,
    stderrIsTty: options.stderrIsTty,

    write(text) {
      process.stdout.write(`${text}\n`)
    },

    writeJson(value) {
      process.stdout.write(`${renderJson(value)}\n`)
    },

    diag(text) {
      process.stderr.write(`${text}\n`)
    },

    warn(text) {
      const prefix = translator.t('cli.warnPrefix')
      process.stderr.write(`${options.color ? paint('accentLight', prefix, true) : prefix} ${text}\n`)
    },

    progress(text) {
      if (!options.stderrIsTty || options.json) return
      // 按终端列宽（而非 UTF-16 长度）补空格，否则 CJK 进度文案会擦不干净
      const width = displayWidth(text)
      const padding = Math.max(0, progressLength - width)
      progressLength = Math.max(progressLength, width)
      process.stderr.write(`\r${text}${' '.repeat(padding)}`)
    },

    clearProgress() {
      if (progressLength === 0) return
      process.stderr.write(`\r${' '.repeat(progressLength)}\r`)
      progressLength = 0
    },

    reportError(error) {
      const message = errorMessage(translator, error)
      if (options.json) {
        const details: Record<string, unknown> = { code: error.code, message }
        if (error.params) details.params = error.params
        if (error.detail) details.detail = error.detail
        process.stderr.write(`${renderJson({ error: details })}\n`)
        return error.exitCode
      }
      const prefix = translator.t('cli.errorPrefix')
      const head = options.color ? paint('accent', prefix, true) : prefix
      process.stderr.write(`${head} ${message}\n`)
      if (error.detail) {
        process.stderr.write(`${options.color ? paint('textSecondary', error.detail, true) : error.detail}\n`)
      }
      return error.exitCode
    },

    accent(text) {
      return paint('accent', text, options.color)
    },

    dim(text) {
      return paint('textSecondary', text, options.color)
    },
  }
}
