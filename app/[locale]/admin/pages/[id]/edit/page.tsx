import { createClient } from '@/utils/supabase/server'
import { PageEditor } from '@/components/admin/pages/PageEditor'
import { notFound } from 'next/navigation'

export default async function EditPage({ 
    params 
}: { 
    params: Promise<{ locale: string, id: string }> 
}) {
    const { locale, id } = await params
    const supabase = await createClient()

    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()

    if (!page) {
        notFound()
    }

    return <PageEditor initialData={page} locale={locale} />
}
