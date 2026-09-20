// ─────────────────────────────────────────────────────────────────────────────
// `aaigc help` / `--help` / `--version` 的输出
//
// 命令清单、tier / capability 取值范围都从 shared/tools 的注册表推导，
// 保证 help 与实际可用工具不会漂移。
// 文案全部读 shared/messages 的 `cli.*`（与 errors.* / tools.* 同一张表）。
//
// 两种渲染共用同一份数据（buildHelp）：
//   · 人读 → renderHelp()，对齐的纯文本
//   · --json → buildHelp() 直接序列化，stdout 上只有一个可解析文档
// ─────────────────────────────────────────────────────────────────────────────

import { listTools } from 'shared/tools'
import { API_BASE_URL_ENV, CONFIG_DIR_ENV, LANG_ENV, TELEMETRY_ENV } from '../core/config'
import { EXIT_FAILURE, EXIT_INTERRUPTED, EXIT_OK, EXIT_USAGE } from '../core/exit-codes'
import type { Translator } from '../core/i18n'
import { supportedLocales } from '../core/i18n'

/** `--json` 下的帮助结构；字段名按各段语义命名，便于脚本消费 */
export interface HelpJson {
  version: string
  commands: { usage: string; description: string }[]
  options: { flag: string; description: string }[]
  env: { name: string; description: string }[]
  examples: string[]
  exitCodes: { code: number; description: string }[]
}

function uniqueSorted(values: readonly string[]): string {
  return [...new Set(values)].sort().join(' | ')
}

export function buildHelp(translator: Translator, version: string): HelpJson {
  const tools = listTools()
  const tiers = uniqueSorted(tools.map((tool) => tool.tier))
  const capabilities = uniqueSorted(tools.flatMap((tool) => tool.capabilities))
  const locales = supportedLocales().join(' | ')

  return {
    version,
    commands: [
      { usage: 'login', description: translator.t('cli.cmdLogin') },
      { usage: 'logout', description: translator.t('cli.cmdLogout') },
      { usage: 'tools list [options]', description: translator.t('cli.cmdToolsList') },
      { usage: 'tools run <toolId> [options]', description: translator.t('cli.cmdToolsRun') },
      { usage: 'favorites list [options]', description: translator.t('cli.cmdFavoritesList') },
      { usage: 'favorites add <toolId> [options]', description: translator.t('cli.cmdFavoritesAdd') },
      { usage: 'favorites remove <toolId> [options]', description: translator.t('cli.cmdFavoritesRemove') },
      { usage: 'help', description: translator.t('cli.cmdHelp') },
    ],
    options: [
      { flag: '--json', description: translator.t('cli.optJson') },
      { flag: '--lang <locale>', description: translator.t('cli.optLang', { locales }) },
      { flag: '--no-color', description: translator.t('cli.optNoColor') },
      { flag: '--color', description: translator.t('cli.optColor') },
      { flag: '--api-base-url <url>', description: translator.t('cli.optApiBaseUrl', { env: API_BASE_URL_ENV }) },
      { flag: '--config-dir <dir>', description: translator.t('cli.optConfigDir', { env: CONFIG_DIR_ENV }) },
      // `--help` 与 `help` 命令语义相同，共用同一条文案（避免两处措辞漂移）
      { flag: '--help, --version', description: `${translator.t('cli.cmdHelp')} / ${translator.t('cli.optVersion')}` },
      { flag: '--tier <tier>', description: translator.t('cli.optTier', { tiers }) },
      { flag: '--capability <cap>', description: translator.t('cli.optCapability', { capabilities }) },
      { flag: '--input <json>', description: translator.t('cli.optInput') },
      { flag: '--since <iso>', description: translator.t('cli.optSince') },
      { flag: '--type <type>', description: translator.t('cli.optType') },
    ],
    env: [
      { name: API_BASE_URL_ENV, description: translator.t('cli.envApiBaseUrl') },
      { name: CONFIG_DIR_ENV, description: translator.t('cli.envConfigDir') },
      { name: LANG_ENV, description: translator.t('cli.envLang') },
      { name: TELEMETRY_ENV, description: translator.t('cli.envTelemetry') },
    ],
    examples: [
      translator.t('cli.exampleLogin'),
      translator.t('cli.exampleToolsRun'),
      translator.t('cli.examplePipe'),
    ],
    // 与 README 的退出码表保持一致（含 130 中断）
    exitCodes: [
      { code: EXIT_OK, description: translator.t('cli.exitCodeOk') },
      { code: EXIT_FAILURE, description: translator.t('cli.exitCodeFailure') },
      { code: EXIT_USAGE, description: translator.t('cli.exitCodeUsage') },
      { code: EXIT_INTERRUPTED, description: translator.t('cli.exitCodeInterrupted') },
    ],
  }
}

export function renderHelp(translator: Translator, version: string): string {
  const help = buildHelp(translator, version)

  const commandRows = help.commands.map((row) => [row.usage, row.description] as const)
  const optionRows = help.options.map((row) => [row.flag, row.description] as const)
  const envRows = help.env.map((row) => [row.name, row.description] as const)

  // 列宽按最长标签动态计算，避免新增命令 / 选项时错行
  const labelWidth = Math.max(
    ...commandRows.map(([label]) => label.length),
    ...optionRows.map(([label]) => label.length),
    ...envRows.map(([label]) => label.length),
  )

  const render = (pairs: readonly (readonly [string, string])[]): string[] =>
    pairs.map(([label, description]) => `  ${label.padEnd(labelWidth + 2)}${description}`)

  const section = (title: string, lines: string[]): string[] => ['', title, ...lines]

  return [
    `${translator.t('cli.appTitle')} (v${version})`,
    translator.t('cli.usageLine'),
    ...section(translator.t('cli.sectionCommands'), render(commandRows)),
    ...section(translator.t('cli.sectionOptions'), render(optionRows)),
    ...section(translator.t('cli.sectionEnv'), render(envRows)),
    ...section(
      translator.t('cli.sectionExamples'),
      help.examples.map((line) => `  ${line}`),
    ),
    ...section(
      translator.t('cli.sectionExitCodes'),
      help.exitCodes.map((row) => `  ${row.code}  ${row.description}`),
    ),
    '',
  ].join('\n')
}
