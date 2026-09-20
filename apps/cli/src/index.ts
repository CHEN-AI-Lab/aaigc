// ─────────────────────────────────────────────────────────────────────────────
// aaigc CLI 入口
//
// 只做四件事，业务逻辑一律在 commands/ 与 core/ 里：
//   1. 解析参数、解析配置（失败 → 退出码 2，且此时还不知道 --json，按原始 argv 粗判）
//   2. 组装 io / translator（输出契约与语言）
//   3. 分发命令，成功即退出码 0
//   4. 任何抛出物经 toCliError 收敛后写 stderr，退出码由错误决定
// ─────────────────────────────────────────────────────────────────────────────

import { defaultLocale } from 'shared/constants/locales'
import { dispatch } from './commands/index'
import { parseCliArgs, type CliArgValues } from './core/args'
import { resolveConfig, type CliConfig } from './core/config'
import { toCliError } from './core/errors'
import { EXIT_INTERRUPTED, type CliExitCode } from './core/exit-codes'
import { createTranslator } from './core/i18n'
import { createIo } from './core/io'
import { VERSION } from './version'

async function run(): Promise<CliExitCode> {
  const argv = process.argv.slice(2)
  // 参数解析失败时 --json 还没被解析出来，只能从原始 argv 粗判，
  // 否则「用法错误」在 --json 下会退化成非 JSON 文本，脚本无法统一解析。
  const wantsJson = argv.includes('--json')

  const bootstrapIo = () =>
    createIo({
      json: wantsJson,
      color: false,
      stdoutIsTty: process.stdout.isTTY === true,
      stderrIsTty: process.stderr.isTTY === true,
      translator: createTranslator(defaultLocale),
    })

  let config: CliConfig
  let values: CliArgValues
  let positionals: string[]
  try {
    const parsed = parseCliArgs(argv)
    values = parsed.values
    positionals = parsed.positionals
    config = resolveConfig(values)
  } catch (error) {
    return bootstrapIo().reportError(toCliError(error))
  }

  const translator = createTranslator(config.lang)
  const io = createIo({
    json: config.json,
    color: config.color,
    stdoutIsTty: config.stdoutIsTty,
    stderrIsTty: config.stderrIsTty,
    translator,
  })

  // 登录轮询期间 Ctrl+C：先擦掉进度行再按约定码退出，避免终端残留半行
  const onSigint = (): void => {
    io.clearProgress()
    process.exit(EXIT_INTERRUPTED)
  }
  process.on('SIGINT', onSigint)

  try {
    return await dispatch({ argv: positionals, values, config, io, translator, version: VERSION })
  } catch (error) {
    io.clearProgress()
    return io.reportError(toCliError(error))
  } finally {
    process.off('SIGINT', onSigint)
    io.clearProgress()
  }
}

process.exitCode = await run()
