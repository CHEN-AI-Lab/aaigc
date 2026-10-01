// 数据层 —— 直接复用 shared/data
//
// 这里**不**复制 shared/data/*.ts 内容，而是直接 import。
// shared/data 是纯 TS（无 React/DOM 依赖），ohpm 通过 workspace:* 引入。
//
// 真实场景：hvigor + ohpm 会把 shared/* 编译到 .hap 里。

import type { ToolMeta } from 'shared/data/tools'
import type { Product } from 'shared/types'

// 重新导出，方便端内组件直接 import
export { tools, toolCategories, categoriesWithTools } from 'shared/data/tools'
export type { ToolMeta, CategoryInfo } from 'shared/data/tools'
export { products } from 'shared/data/products'
export { localeNames, locales, defaultLocale } from 'shared/constants/locales'
export type { Product, Locale } from 'shared/types'