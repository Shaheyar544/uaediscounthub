import { CouponImportWizard } from '@/components/admin/coupons/CouponImportWizard';
import { requireAdmin } from '@/utils/auth/require-admin';

export default async function CouponImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { supabase } = await requireAdmin();
  const { data: stores } = await supabase.from('stores').select('id, name, slug').eq('is_active', true).order('name');
  return <CouponImportWizard locale={locale} stores={stores ?? []} />;
}
