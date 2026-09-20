import type { Product, ProductStatus } from '../types'
import { productUrlMap } from '../constants/endpoints'

/**
 * 11 个产品的静态元数据（图标 / 状态）。
 * URL 一律来自 PRODUCT_URL_MAP_JSON 环境变量（P1-08 / Q-A12），
 * 缺失时 url 为空 → UI 显示「即将上线」，不做非空 fallback。
 */
const urlMap = productUrlMap()

function build(id: string, icon: string, status: ProductStatus): Product {
  const urls = urlMap[id] ?? {}
  return {
    id,
    icon,
    status,
    url: urls.url ?? '',
    previewUrl: urls.previewUrl ?? '',
    productionUrl: urls.productionUrl ?? '',
  }
}

export const products: Product[] = [
  build('cookmate', '🍳', 'live'),
  build('aihub', '🤖', 'wip'),
  build('short-drama', '🎬', 'wip'),
  build('resume-optimizer', '📝', 'wip'),
  build('copycraft', '✍️', 'wip'),
  build('contentforge', '🏗️', 'wip'),
  build('postforge', '📬', 'wip'),
  build('maestro', '🎵', 'wip'),
  build('ai-portfolio-studio', '🎨', 'wip'),
  build('ai-toolbox', '🧰', 'wip'),
  build('content-ai-site', '🌐', 'wip'),
]
