import { describe, it, expect } from 'vitest'
import { products } from '../../data/products'

describe('products', () => {
  it('has 4 products', () => {
    expect(products.length).toBe(4)
  })

  it('each product has required fields', () => {
    for (const p of products) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.nameEn).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.descriptionEn).toBeTruthy()
      expect(p.icon).toBeTruthy()
      expect(p.url).toBeTruthy()
      expect(['live', 'beta', 'wip', 'planned']).toContain(p.status)
      expect(Array.isArray(p.features)).toBe(true)
      expect(Array.isArray(p.featuresEn)).toBe(true)
    }
  })
})

describe('tools', () => {
  it('has 14 tools', async () => {
    const { tools } = await import('../../data/tools')
    expect(tools.length).toBe(14)
  })

  it('each tool has valid category', async () => {
    const { tools } = await import('../../data/tools')
    const validCats = ['dev', 'text', 'time', 'image', 'convert']
    for (const t of tools) {
      expect(validCats).toContain(t.category)
      expect(t.id).toBeTruthy()
      expect(t.component).toBeTruthy()
    }
  })
})