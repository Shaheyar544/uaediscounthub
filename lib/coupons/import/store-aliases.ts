import 'server-only';

import { normalizeStoreIdentity } from './stores';
import { requireCouponImportAdmin } from './authorization';

type StoreAliasDecision = 'approve' | 'reject';

export async function reviewCouponStoreAlias(input: { aliasValue: unknown; decision: StoreAliasDecision; storeId?: unknown }) {
  const aliasValue = typeof input.aliasValue === 'string' ? input.aliasValue.trim() : '';
  const normalizedAlias = normalizeStoreIdentity(aliasValue);
  if (!normalizedAlias) throw new Error('A store value is required.');
  if (input.decision !== 'approve' && input.decision !== 'reject') throw new Error('Invalid store review decision.');
  const storeId = typeof input.storeId === 'string' && input.storeId ? input.storeId : null;
  if (input.decision === 'approve' && !storeId) throw new Error('Choose the verified active store before approving an alias.');

  const { supabase, user } = await requireCouponImportAdmin();
  if (storeId) {
    const { data: store, error } = await supabase.from('stores').select('id').eq('id', storeId).eq('is_active', true).maybeSingle();
    if (error || !store) throw new Error('The selected store is not an active store.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('coupon_store_aliases')
    .select('id, status, store_id')
    .eq('normalized_alias', normalizedAlias)
    .maybeSingle();
  if (existingError) throw new Error('The store alias could not be reviewed.');
  if (existing?.status === 'approved' && existing.store_id !== storeId) {
    throw new Error('This store alias is already approved for a different store.');
  }

  const record = {
    alias_value: aliasValue,
    normalized_alias: normalizedAlias,
    store_id: input.decision === 'approve' ? storeId : null,
    status: input.decision === 'approve' ? 'approved' : 'rejected',
    created_by: user.id,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabase.from('coupon_store_aliases').update(record).eq('id', existing.id)
    : await supabase.from('coupon_store_aliases').insert(record);
  if (error) throw new Error('The store alias could not be saved.');
}
