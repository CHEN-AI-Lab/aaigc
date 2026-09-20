// 工具显示名的唯一解析点：tools.<toolId>.name 来自 shared/messages，
// 未知 id（例如收藏里存了非工具条目）原样回显 id，绝不显示成 i18n key。

import type { Translator } from '../core/i18n'

export function localizedToolName(translator: Translator, toolId: string): string {
  return translator.tOrNull(`tools.${toolId}.name`) ?? toolId
}
