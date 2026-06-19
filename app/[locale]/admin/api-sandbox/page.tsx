import APISandboxClient from './APISandboxClient'
import { AmazonCreatorsAPI } from '@/lib/amazon-creators-api'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isManualMode = AmazonCreatorsAPI.isManualMode()
  return <APISandboxClient locale={locale} isManualMode={isManualMode} />
}
