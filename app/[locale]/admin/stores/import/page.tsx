import { StoreImportWizard } from '@/components/admin/stores/StoreImportWizard';
import { requireAdmin } from '@/utils/auth/require-admin';
export default async function StoreImportPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; await requireAdmin(); return <StoreImportWizard locale={locale} />; }
