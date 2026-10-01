import type { Product, ProductStatus } from '../types'
import { PRODUCT_URLS } from '../constants/products'
import type { ProductUrlEntry } from '../constants/products'

/**
 * 11 个产品的静态元数据（图标 / 状态）。
 * URL 来自 shared/constants/products 常量（不随环境变化，不走环境变量）。
 */
const urlMap: Readonly<Record<string, ProductUrlEntry>> = PRODUCT_URLS

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
