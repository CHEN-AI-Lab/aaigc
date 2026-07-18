import { setRequestLocale } from 'next-intl/server'
import ToolsClient from '../../../components/ToolsClient'

type Props = { params: Promise<{ locale: string }> }

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ToolsClient />
}