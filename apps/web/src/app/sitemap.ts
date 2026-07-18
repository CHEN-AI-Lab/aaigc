import { MetadataRoute } from 'next'
import { products } from 'data/products'
import { tools } from 'data/tools'

const locales = ['zh-CN', 'en', 'ja']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  for (const locale of locales) {
    entries.push(
      { url: `https://aaigc.online/${locale}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
      { url: `https://aaigc.online/${locale}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
      { url: `https://aaigc.online/${locale}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
      { url: `https://aaigc.online/${locale}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `https://aaigc.online/${locale}/updates`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
      { url: `https://aaigc.online/${locale}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    )
  }

  // Product detail pages
  for (const product of products) {
    for (const locale of locales) {
      entries.push({
        url: `https://aaigc.online/${locale}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })
    }
  }

  // Tool pages
  for (const tool of tools) {
    for (const locale of locales) {
      entries.push({
        url: `https://aaigc.online/${locale}/tools/${tool.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    }
  }

  return entries
}