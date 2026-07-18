// ─── Locale ────────────────────────────────────

export type Locale = 'zh-CN' | 'en'

// ─── Product status ────────────────────────────

export type ProductStatus = 'live' | 'beta' | 'wip' | 'planned'

// ─── Product ───────────────────────────────────

export interface Product {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  icon: string
  screenshot?: string
  tags: string[]
  status: ProductStatus
  url: string
  features: string[]
  featuresEn: string[]
}

// ─── Tool category ─────────────────────────────

export type ToolCategoryId = 'dev' | 'text' | 'time' | 'image' | 'convert' | 'security' | 'math'

export interface CategoryInfo {
  id: ToolCategoryId
  name: string
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