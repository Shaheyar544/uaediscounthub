# Supabase Remote Catalog Analysis

## 1. Remote migration history — VERIFIED

The catalog query of supabase_migrations.schema_migrations recovered the actual stored statements for remote version 20260719120000.

| Version | Name | Evidence |
| --- | --- | --- |
| 20260628230348 | add_asin_to_price_history | Local and remote |
| 20260719120000 | drop_unused_indexes | Remote-only locally |
| 20260902175716 | coupon_bulk_import_foundation | Local-only remotely |

The remote migration table stores version, name, and SQL statements. This is stronger evidence than the previous migration-list ledger alone.

## 2. What 20260719120000 changed — VERIFIED

The remote-only migration is recoverable exactly from the remote catalog:

- Name: drop_unused_indexes
- Effect: drops unused plain secondary indexes only.
- Coupon-specific statement: DROP INDEX IF EXISTS public.idx_coupons_active.
- It also drops selected unused indexes on price_history, product_store_prices, products, deals, affiliate_clicks, and blog_posts.
- It explicitly does not drop primary-key or unique indexes.

It creates/changes no table, column, foreign key, RLS policy, trigger, function, enum/type, or coupon data.

## 3. Tables and columns — VERIFIED

All public tables found have RLS enabled. No coupon_imports, coupon_import_rows, or coupon_import_profiles table exists remotely.

Remote coupons columns include id, store_id, code, title_en/title_ar, descriptions, discount_type/value, min_order_value, max_uses/current_uses, is_active, is_verified, is_exclusive, expires_at, click_count, submitted_by, created_at, product_id, and source.

Remote stores includes the core id, slug, name, affiliate_base_url, is_active, and created_at fields required by Phase 1, plus remote-only fields such as name_ar, base_url, payment-support flags, countries, and display/featured fields.

## 4. Constraints and indexes — VERIFIED

Coupons:

- coupons_pkey primary key on id.
- coupons_store_id_fkey to stores(id) ON DELETE CASCADE.
- coupons_product_id_fkey to products(id) ON DELETE SET NULL.
- coupons_submitted_by_fkey to profiles(id).
- Existing secondary index: idx_coupons_store on store_id.
- No unique or expression index on store_id plus normalized code.
- No idx_coupons_active index; this exactly matches the recovered remote-only migration.

Stores:

- stores_pkey primary key.
- stores_slug_key unique constraint/index.

## 5. RLS policies — VERIFIED

Coupons and stores both have RLS enabled.

- Public read policies allow only active rows.
- Coupons have admin-JWT insert/update/delete policies.
- Stores have admin-JWT insert/update/delete policies.
- The older Admin full access coupons/stores ALL policies are also present.

The policies use app_metadata.role = admin, consistent with the local authorization architecture. No import-table policies exist because the import tables do not exist remotely.

## 6. Functions, triggers, and types — VERIFIED

- No public function whose name contains coupon or import is present.
- No non-internal trigger exists on coupons or stores.
- No public enum/domain type associated with coupons/imports exists. The catalog lists only relation composite types.

## 7. Local vs remote comparison

| Object | Classification | Evidence |
| --- | --- | --- |
| Core coupons columns required by Phase 1 | MATCH | Remote catalog confirms them. |
| Core stores/profiles dependency required by Phase 1 | MATCH | Remote catalog confirms required tables/relationships. |
| stores supplementary columns | REMOTE-ONLY | Present remotely, absent from simplified local schema.sql. |
| idx_coupons_active | LOCAL-ONLY after 20260719120000 | Remote migration explicitly dropped it. |
| Coupon normalized-code unique index | LOCAL-ONLY | Defined only by unapplied Phase 1 migration. |
| Import tables/RPCs/policies | LOCAL-ONLY | Defined only by unapplied Phase 1 migration. |
| 20260719120000 SQL | MATCH REMOTE-ONLY history | Recovered directly from schema_migrations. |

## 8. Missing migration analysis

Conclusion: **A — effect can be confidently reconstructed.**

The full statements were recovered directly from the remote migration-history catalog. The only coupon-related effect is removal of idx_coupons_active. It does not introduce an object on which Phase 1 depends.

## 9. Phase 1 dependency analysis

Phase 1 depends on coupons, stores, profiles, products, RLS, and standard public-schema functionality. All required pre-existing objects are VERIFIED in the remote catalog.

20260719120000 does not create or alter any Phase 1 dependency; it only removes secondary indexes. Phase 1’s new normalized-code index, import tables, policies, and RPCs have no name or semantic collision with the recovered migration.

Confidence: HIGH that Phase 1 has no direct dependency on 20260719120000.

## 10. Recommended safe next step

Do not repair history yet. First add the recovered SQL as the exact historical local migration file named 20260719120000_drop_unused_indexes.sql, then review its source parity against the remote catalog statements.

After that file is present, run a read-only linked migration list. If all history through 20260719120000 matches and Phase 1 remains the only local-only migration, the next separate approval can apply only the reviewed Phase 1 migration.

## Exact commands for the next phase

After the recovery file is created and reviewed:

    supabase migration list --linked
    supabase db query --linked --output json "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;"

After explicit approval to deploy Phase 1:

    supabase db push --linked

## Commands that must NOT be run now

- supabase migration repair
- supabase db pull
- supabase db reset
- direct UPDATE/INSERT/DELETE against migration history
- any coupon/data mutation

REMOTE CATALOG ANALYSIS: COMPLETE
