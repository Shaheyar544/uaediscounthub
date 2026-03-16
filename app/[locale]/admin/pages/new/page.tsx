import { PageEditor } from '@/components/admin/pages/PageEditor'

export default async function NewPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    
    return <PageEditor locale={locale} />
}
