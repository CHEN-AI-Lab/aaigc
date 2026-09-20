// ─────────────────────────────────────────────────────────────────────────────
// shared/js/entry.ts —— esbuild 打包入口（产物 shared/js/shared.mjs，入库）
//
// 覆盖小程序的全部共享需求：38 个工具纯函数 + 静态数据 + 主题/项目常量 + 精简 i18n。
// 不引入任何 npm 运行时依赖，不含任何平台 API（由 purity 测试机械保证）。
// ─────────────────────────────────────────────────────────────────────────────

export * from '../tools'
export * from '../tools/registry'
export * from '../types/platform'

export { tools, toolCategories, categoriesWithTools } from '../data/tools'
export type { ToolMeta } from '../data/tools'
export { products } from '../data/products'

export {
  THEME_COLOR_NAMES,
  THEME_CSS_VARIABLES,
  LIGHT_THEME_TOKENS,
  THEME_MODES,
  DEFAULT_THEME_MODE,
  THEME_ANSI,
} from '../constants/theme'
export { PLATFORMS, PROJECT_IDS, DEFAULT_PROJECT_ID } from '../constants/projects'
export { TOOL_ERROR_CODES } from '../constants/error-codes'

// ─── 精简 i18n（语言包由端侧按需加载切片后传入，不进 bundle） ─────────────

export type MessageBundle = Record<string, unknown>

/** 按点路径取值；缺失返回 undefined，调用方决定兜底 */
export function lookupMessage(bundle: MessageBundle, path: string): string | undefined {
  let cursor: unknown = bundle
  for (const segment of path.split('.')) {
    if (cursor === null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return typeof cursor === 'string' ? cursor : undefined
}

/** 支持 {name} 占位符插值 */
export function formatMessage(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

/** 生成 translator：t('tools.copy') / t('errors.loginRequired', { count: 2 }) */
export function createTranslator(
  bundle: MessageBundle,
  fallback?: MessageBundle,
): (path: string, params?: Record<string, string | number>) => string {
  return (path: string, params?: Record<string, string | number>): string => {
    const template = lookupMessage(bundle, path) ?? (fallback ? lookupMessage(fallback, path) : undefined)
    if (template === undefined) return path
    return formatMessage(template, params)
  }
}

// ─── ToolContext 工厂（时间与随机由端侧注入，保证可测与跨端一致） ──────────
// 实现已下沉到 shared/tools/context.ts（避免端侧为了拿工厂而拖入整个 entry 模块）。
// 这里显式 re-export，导出面与下沉前完全一致。

export { createToolContext, defaultRandomBytes } from '../tools/context'
export type { ToolContextOverrides } from '../tools/context'
