import { getTranslations, setRequestLocale } from 'next-intl/server'
import { products } from 'data/products'
import ProductsClient from '../../../components/ProductsClient'

type Props = { params: Promise<{ locale: string }> }

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'products' })

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="section-title text-text-primary mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-10">{t('subtitle')}</p>
      <ProductsClient products={products} />
    </div>
  )
}