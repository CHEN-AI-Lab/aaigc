// 命令分发 —— 唯一的「命令名 → 实现」映射
//
// 退出码语义（见 core/exit-codes.ts）：
//   · 参数形态不合法（未知命令、非法选项、缺少必需参数）→ 2
//   · 参数合法但目标不存在 / 服务端拒绝 / 工具执行失败 → 1
// 命令实现只负责「成功时输出」，失败一律 throw CliError，由 index.ts 单点收敛。

import type { CliArgValues } from '../core/args'
import { EXIT_OK, type CliExitCode } from '../core/exit-codes'
import { usageError } from '../core/errors'
import { favoritesAddCommand, favoritesListCommand, favoritesRemoveCommand } from './favorites'
import { renderHelp } from './help'
import { loginCommand } from './login'
import { logoutCommand } from './logout'
import { toolsListCommand, toolsRunCommand } from './tools'
import type { CommandContext } from './types'

export interface DispatchInput extends CommandContext {
  /** 位置参数：argv 去掉选项后的部分 */
  argv: string[]
  values: CliArgValues
  version: string
}

/**
 * 多余位置参数直接报用法错误。
 * 静默忽略是 CLI 最难查的一类事故（`aaigc login --json extra` 会让人以为参数生效了）。
 */
function rejectExtraPositionals(
  extras: readonly (string | undefined)[],
  usage: string,
): void {
  const present = extras.filter((value): value is string => value !== undefined)
  if (present.length > 0) {
    throw usageError(undefined, `Unexpected argument(s): ${present.join(' ')} (usage: ${usage})`)
  }
}

export async function dispatch(input: DispatchInput): Promise<CliExitCode> {
  const ctx: CommandContext = {
    config: input.config,
    io: input.io,
    translator: input.translator,
  }
  const [command, subcommand, ...rest] = input.argv

  if (input.values.version === true) {
    input.io.write(input.version)
    return EXIT_OK
  }

  if (command === undefined || command === 'help' || input.values.help === true) {
    input.io.write(renderHelp(input.translator, input.version))
    return EXIT_OK
  }

  switch (command) {
    case 'login':
      rejectExtraPositionals([subcommand, ...rest], 'aaigc login')
      await loginCommand(ctx)
      return EXIT_OK
    case 'logout':
      rejectExtraPositionals([subcommand, ...rest], 'aaigc logout')
      await logoutCommand(ctx)
      return EXIT_OK
    case 'tools':
      return await dispatchTools(ctx, subcommand, rest, input.values)
    case 'favorites':
      return await dispatchFavorites(ctx, subcommand, rest, input.values)
    default:
      throw usageError(undefined, `Unknown command: ${command}`)
  }
}

async function dispatchTools(
  ctx: CommandContext,
  subcommand: string | undefined,
  rest: string[],
  values: CliArgValues,
): Promise<CliExitCode> {
  switch (subcommand) {
    case 'list':
      rejectExtraPositionals(rest, 'aaigc tools list')
      await toolsListCommand(ctx, values)
      return EXIT_OK
    case 'run':
      rejectExtraPositionals(rest.slice(1), 'aaigc tools run <toolId>')
      await toolsRunCommand(ctx, rest, values)
      return EXIT_OK
    case undefined:
      throw usageError(undefined, 'Missing subcommand: expected `tools list` or `tools run <toolId>`')
    default:
      throw usageError(undefined, `Unknown subcommand: tools ${subcommand}`)
  }
}

async function dispatchFavorites(
  ctx: CommandContext,
  subcommand: string | undefined,
  rest: string[],
  values: CliArgValues,
): Promise<CliExitCode> {
  switch (subcommand) {
    case 'list':
      rejectExtraPositionals(rest, 'aaigc favorites list')
      await favoritesListCommand(ctx, values)
      return EXIT_OK
    case 'add':
      rejectExtraPositionals(rest.slice(1), 'aaigc favorites add <toolId>')
      await favoritesAddCommand(ctx, rest, values)
      return EXIT_OK
    case 'remove':
      rejectExtraPositionals(rest.slice(1), 'aaigc favorites remove <toolId>')
      await favoritesRemoveCommand(ctx, rest, values)
      return EXIT_OK
    case undefined:
      throw usageError(undefined, 'Missing subcommand: expected list | add | remove')
    default:
      throw usageError(undefined, `Unknown subcommand: favorites ${subcommand}`)
  }
}
