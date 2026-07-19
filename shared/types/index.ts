// ─── Locale ────────────────────────────────────

export type Locale = 'zh-CN' | 'en' | 'ja'

// ─── Product status ────────────────────────────

export type ProductStatus = 'live' | 'beta' | 'wip' | 'planned'

// ─── Product ───────────────────────────────────

export interface Product {
  id: string
  icon: string
  screenshot?: string
  tags: string[]
  status: ProductStatus
  url: string
}

// ─── Tool category ─────────────────────────────

export type ToolCategoryId = 'dev' | 'text' | 'time' | 'image' | 'convert' | 'security' | 'math'

export interface CategoryInfo {
  id: ToolCategoryId
  nameEn: string
  icon: string
  order: number
}

// ─── Tool ───────────────────────────────────────

export interface Tool {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  category: ToolCategoryId
  icon: string
  component: string
  isClientOnly: boolean
  npmDeps?: string[]
}