import { MetadataRoute } from 'next'
import { products } from 'data/products'
import { tools } from 'data/tools'
import { locales } from 'shared/constants/locales'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  for (const locale of locales) {
    entries.push(
      { url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
      { url: `${baseUrl}/${locale}/products`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
      { url: `${baseUrl}/${locale}/tools`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
      { url: `${baseUrl}/${locale}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${baseUrl}/${locale}/updates`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: `${baseUrl}/${locale}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
    )
  }

  // Product detail pages
  for (const product of products) {
    for (const locale of locales) {
      entries.push({
        url: `${baseUrl}/${locale}/products/${product.id}`,
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
        url: `${baseUrl}/${locale}/tools/${tool.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    }
  }

  return entries
}