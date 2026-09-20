// ─────────────────────────────────────────────────────────────────────────────
// `aaigc help` / `--help` / `--version` 的输出
//
// 命令清单、tier / capability 取值范围都从 shared/tools 的注册表推导，
// 保证 help 与实际可用工具不会漂移。
// 文案全部读 shared/messages 的 `cli.*`（与 errors.* / tools.* 同一张表）。
// ─────────────────────────────────────────────────────────────────────────────

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
    ['login', translator.t('cli.cmdLogin')],
    ['logout', translator.t('cli.cmdLogout')],
    ['tools list [options]', translator.t('cli.cmdToolsList')],
    ['tools run <toolId> [options]', translator.t('cli.cmdToolsRun')],
    ['favorites list [options]', translator.t('cli.cmdFavoritesList')],
    ['favorites add <toolId> [options]', translator.t('cli.cmdFavoritesAdd')],
    ['favorites remove <toolId> [options]', translator.t('cli.cmdFavoritesRemove')],
    ['help', translator.t('cli.cmdHelp')],
  ]

  const optionEntries: [string, string][] = [
    ['--json', translator.t('cli.optJson')],
    ['--lang <locale>', translator.t('cli.optLang', { locales })],
    ['--no-color', translator.t('cli.optNoColor')],
    ['--color', translator.t('cli.optColor')],
    ['--api-base-url <url>', translator.t('cli.optApiBaseUrl', { env: API_BASE_URL_ENV })],
    ['--config-dir <dir>', translator.t('cli.optConfigDir', { env: CONFIG_DIR_ENV })],
    // `--help` 与 `help` 命令语义相同，共用同一条文案（避免两处措辞漂移）
    ['--help, --version', `${translator.t('cli.cmdHelp')} / ${translator.t('cli.optVersion')}`],
    ['--tier <tier>', translator.t('cli.optTier', { tiers })],
    ['--capability <cap>', translator.t('cli.optCapability', { capabilities })],
    ['--input <json>', translator.t('cli.optInput')],
    ['--since <iso>', translator.t('cli.optSince')],
    ['--type <type>', translator.t('cli.optType')],
  ]

  const envEntries: [string, string][] = [
    [API_BASE_URL_ENV, translator.t('cli.envApiBaseUrl')],
    [CONFIG_DIR_ENV, translator.t('cli.envConfigDir')],
    [LANG_ENV, translator.t('cli.envLang')],
    [TELEMETRY_ENV, translator.t('cli.envTelemetry')],
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
    `${translator.t('cli.appTitle')} (v${version})`,
    translator.t('cli.usageLine'),
    ...section(translator.t('cli.sectionCommands'), render(entries)),
    ...section(translator.t('cli.sectionOptions'), render(optionEntries)),
    ...section(translator.t('cli.sectionEnv'), render(envEntries)),
    ...section(translator.t('cli.sectionExamples'), [
      `  ${translator.t('cli.exampleLogin')}`,
      `  ${translator.t('cli.exampleToolsRun')}`,
      `  ${translator.t('cli.examplePipe')}`,
    ]),
    ...section(translator.t('cli.sectionExitCodes'), [
      `  0  ${translator.t('cli.exitCodeOk')}`,
      `  1  ${translator.t('cli.exitCodeFailure')}`,
      `  2  ${translator.t('cli.exitCodeUsage')}`,
    ]),
    '',
  ].join('\n')
}
