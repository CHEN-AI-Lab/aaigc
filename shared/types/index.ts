// ─── Locale ────────────────────────────────────

export type Locale = 'zh-CN' | 'en' | 'ja' | 'zh-TW'

// ─── Product status ────────────────────────────

export type ProductStatus = 'live' | 'beta' | 'wip' | 'planned'

// ─── Product ───────────────────────────────────

export interface Product {
  id: string
  icon: string
  status: ProductStatus
  url?: string
}

// ─── Tool category ─────────────────────────────

export type ToolCategoryId = 'dev' | 'text' | 'time' | 'image' | 'convert' | 'security' | 'math' | 'network' | 'ai' | 'other'

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

// ─── Favorites / Likes ──────────────────────────

export interface FavoriteItem {
  id: string
  toolId: string
  createdAt: string
}

export interface LikeStatus {
  liked: boolean
  count: number
}