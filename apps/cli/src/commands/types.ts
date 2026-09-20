// 命令层共用的执行上下文（与 core 层解耦，避免 commands ↔ index 循环依赖）

import type { CliConfig } from '../core/config'
import type { Io } from '../core/io'
import type { Translator } from '../core/i18n'

export interface CommandContext {
  config: CliConfig
  io: Io
  translator: Translator
}
