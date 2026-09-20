// `aaigc help` / `--help` / `--version` 的输出
//
// 命令清单、tier / capability 取值范围都从 shared/tools 的注册表推导，
// 保证 help 与实际可用工具不会漂移。

import { listTools } from 'shared/tools'
import { API_BASE_URL_ENV, CONFIG_DIR_ENV, LANG_ENV, TELEMETRY_ENV } from '../core/config'
import type { Translator } from '../core/i18n'
import { supportedLocales } from '../core/i18n'

function uniqueSorted(values: readonly string[]): string {
  return [...new Set(values)].sort().join(' | ')
}

export function renderHelp(translator: Translator, version: string): string {
  const tools = listTools()
  const tiers = uniqueSorted(tools.map((tool) => tool.tier))
  const capabilities = uniqueSorted(tools.flatMap((tool) => tool.capabilities))
  const locales = supportedLocales().join(' | ')

  // 列宽按最长标签动态计算，避免新增命令 / 选项时错行
  const entries: [string, string][] = [
    ['login', translator.c('cmdLogin')],
    ['logout', translator.c('cmdLogout')],
    ['tools list [options]', translator.c('cmdToolsList')],
    ['tools run <toolId> [options]', translator.c('cmdToolsRun')],
    ['favorites list [options]', translator.c('cmdFavoritesList')],
    ['favorites add <toolId> [options]', translator.c('cmdFavoritesAdd')],
    ['favorites remove <toolId> [options]', translator.c('cmdFavoritesRemove')],
    ['help', translator.c('cmdHelp')],
  ]

  const optionEntries: [string, string][] = [
    ['--json', translator.c('optJson')],
    ['--lang <locale>', translator.c('optLang', { locales })],
    ['--no-color', translator.c('optNoColor')],
    ['--color', translator.c('optColor')],
    ['--api-base-url <url>', translator.c('optApiBaseUrl', { env: API_BASE_URL_ENV })],
    ['--config-dir <dir>', translator.c('optConfigDir', { env: CONFIG_DIR_ENV })],
    ['--help, --version', `${translator.c('optHelp')} / ${translator.c('optVersion')}`],
    ['--tier <tier>', translator.c('optTier', { tiers })],
    ['--capability <cap>', translator.c('optCapability', { capabilities })],
    ['--input <json>', translator.c('optInput')],
    ['--since <iso>', translator.c('optSince')],
    ['--type <type>', translator.c('optType')],
  ]

  const envEntries: [string, string][] = [
    [API_BASE_URL_ENV, translator.c('envApiBaseUrl')],
    [CONFIG_DIR_ENV, translator.c('envConfigDir')],
    [LANG_ENV, translator.c('envLang')],
    [TELEMETRY_ENV, translator.c('envTelemetry')],
  ]

  const labelWidth = Math.max(
    ...entries.map(([label]) => label.length),
    ...optionEntries.map(([label]) => label.length),
    ...envEntries.map(([label]) => label.length),
  )

  const render = (pairs: readonly [string, string][]): string[] =>
    pairs.map(([label, description]) => `  ${label.padEnd(labelWidth + 2)}${description}`)

  const section = (title: string, lines: string[]): string[] => ['', title, ...lines]

  return [
    `${translator.c('appTitle')} (v${version})`,
    translator.c('usageLine'),
    ...section(translator.c('sectionCommands'), render(entries)),
    ...section(translator.c('sectionOptions'), render(optionEntries)),
    ...section(translator.c('sectionEnv'), render(envEntries)),
    ...section(translator.c('sectionExamples'), [
      `  ${translator.c('exampleLogin')}`,
      `  ${translator.c('exampleToolsRun')}`,
      `  ${translator.c('examplePipe')}`,
    ]),
    ...section(translator.c('sectionExitCodes'), [
      `  0  ${translator.c('exitCodeOk')}`,
      `  1  ${translator.c('exitCodeFailure')}`,
      `  2  ${translator.c('exitCodeUsage')}`,
    ]),
    '',
  ].join('\n')
}
