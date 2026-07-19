import type { Product, ProductStatus } from '../shared/types'

export const products: Product[] = [
  { id: 'cookmate', icon: '🍳', status: 'live' as ProductStatus, url: 'https://cookmate.aaigc.online' },
  { id: 'aihub', icon: '🤖', status: 'live' as ProductStatus, url: 'https://aihub.aaigc.online' },
  { id: 'short-drama', icon: '🎬', status: 'wip' as ProductStatus, url: '' },
  { id: 'resume-optimizer', icon: '📝', status: 'wip' as ProductStatus, url: '' },
  { id: 'copycraft', icon: '✍️', status: 'wip' as ProductStatus, url: '' },
  { id: 'contentforge', icon: '🏗️', status: 'wip' as ProductStatus, url: '' },
  { id: 'postforge', icon: '📬', status: 'wip' as ProductStatus, url: '' },
  { id: 'maestro', icon: '🎵', status: 'wip' as ProductStatus, url: '' },
  { id: 'ai-portfolio-studio', icon: '🎨', status: 'wip' as ProductStatus, url: '' },
  { id: 'ai-toolbox', icon: '🧰', status: 'wip' as ProductStatus, url: '' },
  { id: 'content-ai-site', icon: '🌐', status: 'wip' as ProductStatus, url: '' },
]