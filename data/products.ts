import type { Product, ProductStatus } from '../shared/types'

export const products: Product[] = [
  // ─── Live (已上线) ───
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

  // ─── In Development (开发中) ───
  {
    id: 'short-drama',
    icon: '🎬',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'resume-optimizer',
    icon: '📝',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'copycraft',
    icon: '✍️',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'contentforge',
    icon: '🏗️',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'postforge',
    icon: '📬',
    tags: ['Next.js'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'maestro',
    icon: '🎵',
    tags: ['Next.js', 'AI'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'ai-portfolio-studio',
    icon: '🎨',
    tags: ['Next.js'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'ai-toolbox',
    icon: '🧰',
    tags: ['Next.js'],
    status: 'wip' as ProductStatus,
    url: '',
  },
  {
    id: 'content-ai-site',
    icon: '🌐',
    tags: ['Next.js'],
    status: 'wip' as ProductStatus,
    url: '',
  },
]