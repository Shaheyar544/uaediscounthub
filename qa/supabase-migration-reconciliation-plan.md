# Supabase Migration Reconciliation Plan

## 1. Remote migration history

| Version | Local | Remote | Name |
| --- | --- | --- | --- |
| 20260628230348 | Yes | Yes | add_asin_to_price_history |
| 20260719120000 | No | Yes | drop_unused_indexes |
| 20260902175716 | Yes | No | coupon_bulk_import_foundation |

## 2. Local state — VERIFIED

supabase/migrations/20260719120000_drop_unused_indexes.sql does not exist locally.

The local checkout/searchable Git objects contain no earlier copy. It is a shallow checkout, but the remote migration catalog provides the original stored migration statements directly.

## 3. Recovered historical migration — VERIFIED

The remote supabase_migrations.schema_migrations catalog stores version 20260719120000 with name drop_unused_indexes and the following verified operations:

- DROP INDEX IF EXISTS public.idx_price_history_product
- DROP INDEX IF EXISTS public.idx_price_history_lookup
- DROP INDEX IF EXISTS public.idx_ph_product
- DROP INDEX IF EXISTS public.idx_ph_store
- DROP INDEX IF EXISTS public.idx_psp_product
- DROP INDEX IF EXISTS public.idx_psp_store
- DROP INDEX IF EXISTS public.idx_products_featured
- DROP INDEX IF EXISTS public.idx_products_trending
- DROP INDEX IF EXISTS public.idx_products_brand
- DROP INDEX IF EXISTS public.idx_products_category
- DROP INDEX IF EXISTS public.idx_coupons_active
- DROP INDEX IF EXISTS public.deals_active_discount_idx
- DROP INDEX IF EXISTS public.idx_clicks_date
- DROP INDEX IF EXISTS public.blog_posts_is_featured_idx
- DROP INDEX IF EXISTS public.blog_posts_category_id_idx
- DROP INDEX IF EXISTS public.blog_posts_published_at_idx

The catalog-stored comments state that the migration drops only unused plain secondary indexes and deliberately excludes primary and unique indexes.

## 4. Detail classification

| Detail | Classification | Evidence |
| --- | --- | --- |
| Version/name | VERIFIED | Remote schema_migrations row |
| Every DROP INDEX name above | VERIFIED | Remote schema_migrations statements |
| Coupon effect is only idx_coupons_active removal | VERIFIED | Remote statements + remote index catalog |
| Original comments/rationale | VERIFIED | Remote stored statements |
| Index definitions before removal | INFERRED where local migrations define them; otherwise UNKNOWN | A dropped index is absent remotely, and not every original definition is present in local migration files |
| No table/data/RLS/function/trigger/type operation | VERIFIED | Complete catalog-stored statement list |

## 5. Recommended reconciliation strategy

**Strategy A: restore the missing historical migration locally, verbatim.**

Create the missing file with exactly the recovered statement list and historical comments. Do not create a minimal placeholder and do not use migration repair.

Why:

- The exact historical source is available from the remote ledger.
- A placeholder would make local history look complete while losing reproducibility of the remote schema evolution.
- Migration repair would alter metadata without restoring source truth.
- The operations use DROP INDEX IF EXISTS, so they remain historically idempotent if a full local database is later rebuilt.

## 6. Phase 1 safety — VERIFIED

20260902175716_coupon_bulk_import_foundation.sql creates a new normalized coupon identity index, new coupon-import tables, new RLS policies, and two new RPCs.

It does not recreate, reference, or depend on any index removed by 20260719120000. The remote catalog confirms the Phase 1 prerequisites (coupons, stores, profiles, products, core foreign keys, and admin JWT RLS model) already exist.

After the historical file is restored, applying Phase 1 will not recreate or drop the indexes from 20260719120000.

## 7. Exact commands for the next phase

After a reviewer creates/reviews the exact historical file:

    supabase migration list --linked
    supabase db query --linked --output json "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;"

Expected result:

- 20260719120000 aligns as local and remote.
- 20260902175716 is the sole local-only pending migration.
- No remote schema/data/migration-history change occurs during these verification commands.

Only under a separate explicit deployment approval:

    supabase db push --linked

## 8. Rollback and safety considerations

- Do not run the reconstructed historical migration against the already-migrated remote database; it is for source-history restoration, not replay.
- Do not use migration repair, db reset, db pull, or direct migration-history DML.
- Back up/review the historical file before committing it.
- Before Phase 1 deployment, repeat its duplicate/null-store preflight; its own fail-closed guard remains the final protection against unsafe coupon-data conditions.

RECONCILIATION PLAN: READY
