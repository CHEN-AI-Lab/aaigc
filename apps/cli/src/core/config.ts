// ─────────────────────────────────────────────────────────────────────────────
// CLI 运行时配置
//
// 取值优先级一律是「命令行 flag → 环境变量 → 约定默认值」，
// 但**凡是与外部服务地址相关的项，未配置就明确失败**（SK-8：禁止非空 fallback）。
// 这里没有任何「悄悄指向生产站」的兜底：`AAIGC_API_BASE_URL` 没配，
// 需要联网的命令就以 cliConfigMissing（退出码 2）停下并告诉用户怎么配。
// ─────────────────────────────────────────────────────────────────────────────

import os from 'node:os'
import path from 'node:path'
import { defaultLocale } from 'shared/constants/locales'
import { TELEMETRY_OFF_BY_DEFAULT_PLATFORMS } from 'shared/constants/projects'
import type { Locale, Platform } from 'shared/types'
import type { CliArgValues } from './args'
import { configMissingError, usageError } from './errors'
import { createTranslator, parseLocale, supportedLocales } from './i18n'
import type { Translator } from './i18n'

/** 平台维度取值（SK-6：不散落裸字符串） */
export const CLI_PLATFORM: Platform = 'cli'

export const API_BASE_URL_ENV = 'AAIGC_API_BASE_URL'
export const CONFIG_DIR_ENV = 'AAIGC_CONFIG_DIR'
export const LANG_ENV = 'AAIGC_LANG'
export const TELEMETRY_ENV = 'AAIGC_TELEMETRY'

/** 用户配置目录名（凭证落盘处，权限 0700 / 文件 0600） */
export const APP_DIR_NAME = 'aaigc'
export const TOKEN_FILE_NAME = 'tokens.json'
export const DEVICE_ID_FILE_NAME = 'device-id'

/** 配置目录权限：同机其它用户不可进入 */
export const CONFIG_DIR_MODE = 0o700
/** 落盘的敏感文件权限（token / device id） */
export const SECRET_FILE_MODE = 0o600

const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

/** 默认关闭埋点的端由 shared 常量决定（cli 在列） */
const DEFAULT_TELEMETRY_ENABLED = !TELEMETRY_OFF_BY_DEFAULT_PLATFORMS.includes(CLI_PLATFORM)

export interface CliConfig {
  /** '' = 未配置；联网命令必须用 requireApiBaseUrl 先校验 */
  apiBaseUrl: string
  configDir: string
  lang: Locale
  json: boolean
  color: boolean
  telemetryEnabled: boolean
  stdoutIsTty: boolean
  stderrIsTty: boolean
}

export type EnvLike = Record<string, string | undefined>

export interface TtyFlags {
  stdout: boolean
  stderr: boolean
}

function readEnv(env: EnvLike, name: string): string | undefined {
  const value = env[name]
  return value === undefined ? undefined : value
}

/**
 * 规范化 API 基址：去掉尾部斜杠，并校验是可用的 http(s) origin。
 * 非法取值直接报用法错误，不做任何「补全成某个默认域名」的处理。
 */
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw usageError(undefined, `Invalid API base URL: ${raw}`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw usageError(undefined, `API base URL must be http(s): ${raw}`)
  }
  if (parsed.host.length === 0) {
    throw usageError(undefined, `API base URL has no host: ${raw}`)
  }
  return trimmed
}

/** 平台约定的用户配置目录（不是「兜底域名」，属于 OS 惯例） */
export function resolveConfigDir(explicit: string, env: EnvLike, home: string): string {
  if (explicit.trim().length > 0) return path.resolve(explicit.trim())
  const xdg = readEnv(env, 'XDG_CONFIG_HOME')?.trim()
  if (xdg) return path.join(xdg, APP_DIR_NAME)
  if (process.platform === 'win32') {
    const appData = readEnv(env, 'APPDATA')?.trim()
    const base = appData && appData.length > 0 ? appData : path.join(home, 'AppData', 'Roaming')
    return path.join(base, APP_DIR_NAME)
  }
  return path.join(home, '.config', APP_DIR_NAME)
}

export function resolveConfig(
  values: CliArgValues,
  env: EnvLike = process.env,
  tty: TtyFlags = { stdout: process.stdout.isTTY === true, stderr: process.stderr.isTTY === true },
): CliConfig {
  const json = values.json === true

  const rawLang = values.lang ?? readEnv(env, LANG_ENV) ?? ''
  let lang: Locale = defaultLocale
  if (rawLang.trim().length > 0) {
    const parsed = parseLocale(rawLang)
    if (!parsed) {
      // 语言非法时还不知道用哪种语言报错，用默认语言渲染提示
      const hint = createTranslator(defaultLocale).c('hintLang', {
        locales: supportedLocales().join(' | '),
      })
      throw usageError(undefined, `${hint} (got: ${rawLang})`)
    }
    lang = parsed
  }

  const flagBaseUrl = values['api-base-url']
  const envBaseUrl = readEnv(env, API_BASE_URL_ENV)
  const rawBaseUrl = flagBaseUrl ?? envBaseUrl ?? ''
  const apiBaseUrl = rawBaseUrl.trim().length > 0 ? normalizeBaseUrl(rawBaseUrl) : ''

  const configDir = resolveConfigDir(
    values['config-dir'] ?? readEnv(env, CONFIG_DIR_ENV) ?? '',
    env,
    os.homedir(),
  )

  const forceColor = values.color === true
  const noColorEnv = readEnv(env, 'NO_COLOR')
  const disableColor = values['no-color'] === true || (noColorEnv !== undefined && noColorEnv !== '')
  const termOk = (readEnv(env, 'TERM') ?? '') !== 'dumb'
  // --json 是机器消费场景，颜色一律关闭（stdout 上不能出现转义序列）
  const color = !json && termOk && (forceColor || (!disableColor && tty.stdout))

  const rawTelemetry = readEnv(env, TELEMETRY_ENV)
  const telemetryEnabled =
    rawTelemetry === undefined || rawTelemetry.trim().length === 0
      ? DEFAULT_TELEMETRY_ENABLED
      : TRUTHY.has(rawTelemetry.trim().toLowerCase())

  return {
    apiBaseUrl,
    configDir,
    lang,
    json,
    color,
    telemetryEnabled,
    stdoutIsTty: tty.stdout,
    stderrIsTty: tty.stderr,
  }
}

/** 联网命令的前置校验：未配置就明确失败，绝不回落到任何内置域名 */
export function requireApiBaseUrl(config: CliConfig, translator: Translator): string {
  if (config.apiBaseUrl.length === 0) {
    throw configMissingError(
      undefined,
      translator.c('hintApiBaseUrl', { env: API_BASE_URL_ENV }),
    )
  }
  return config.apiBaseUrl
}
