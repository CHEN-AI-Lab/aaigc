import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { tools } from 'data/tools'
import ToolPageClient from '../../../../components/ToolPageClient'

type Props = { params: Promise<{ locale: string; slug: string }> }

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const tool of tools) {
    params.push({ locale: 'zh-CN', slug: tool.id })
    params.push({ locale: 'en', slug: tool.id })
  }
  return params
}

export default async function ToolDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const tool = tools.find((t) => t.id === slug)
  if (!tool) notFound()

  return <ToolPageClient slug={slug} />
}