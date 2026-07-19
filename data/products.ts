import type { Product, ProductStatus } from '../shared/types'

export const products: Product[] = [
  {
    id: 'cookmate',
    icon: '🍳',
    tags: ['Next.js', 'AI', 'Prisma'],
    status: 'live' as ProductStatus,
    url: 'https://cookmate.aaigc.online',
  },
  {
    id: 'aihub',
    icon: '🤖',
    tags: ['Next.js', 'Directory'],
    status: 'live' as ProductStatus,
    url: 'https://aihub.aaigc.online',
  },
  {
    id: 'short-drama',
    icon: '🎬',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: 'https://short-drama.aaigc.online',
  },
  {
    id: 'resume-optimizer',
    icon: '📝',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: 'https://resume-optimizer.aaigc.online',
  },
]