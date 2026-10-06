# Coupon Bulk Import — Phase 1 Foundation

## Scope

Implemented the schema, security, transaction, and pure-domain foundation only. No import UI, CSV/XLSX parser, upload endpoint, manual coupon flow change, or dependency installation was performed. The migration has **not** been applied to any database.

## Schema reconciliation

The deployed/exported coupon shape was reconciled before writing the migration.

| Source | Finding |
| --- | --- |
| supabase/schema.sql | Stale coupon fields: min_spend, max_discount, starts_at, and use_count. |
| Existing migrations | The later coupon migration establishes product_id and source; current RLS migrations establish the admin JWT role convention. |
| exports/supabase/coupons.json | Current rows use min_order_value, max_uses, current_uses, is_exclusive, click_count, submitted_by, product_id, and source; they do not use the stale baseline fields. |
| Live read-only preflight | 21 coupons, 5 stores, 0 null/unresolved store_id values, and 0 duplicate groups under canonical store/code identity. |

supabase/schema.sql now describes the reconciled coupon shape. The Phase 1 migration adds no coupon columns and does not mutate existing coupon rows.

## Migration

Created supabase/migrations/20260902175716_coupon_bulk_import_foundation.sql.

Before creating the canonical identity index, the migration itself fail-closes if deployment-time data has either:

- a null or unresolved coupon store_id; or
- an existing duplicate store/code identity group.

It performs no cleanup. If either check fails, deployment stops and the conflicting data must be reconciled explicitly before retrying.

The canonical uniqueness safeguard is an expression unique index on store_id and upper(btrim(code)), with a store_id-not-null predicate.

This is the database equivalent of the shared domain normalization: trim, then uppercase coupon code. Import commits also require a valid active store, so new imports cannot rely on the nullable legacy path.

## Import data model

The migration creates:

- coupon_import_profiles: admin-owned recurring source/mapping settings.
- coupon_imports: one staged batch with source hash, mapping snapshot, validation hash/version, lifecycle timestamps, actor references, and rollback fields.
- coupon_import_rows: row-level raw/normalized snapshots, duplicate fingerprint, validation messages, outcome, inserted coupon reference, and immutable-at-commit coupon snapshot.

Indexes cover admin history, lifecycle queries, profile lookup, per-import status ordering, duplicate fingerprints, and inserted coupon lookup.

## Security and authorization

- All three tables enable RLS.
- anon and authenticated grants are revoked first; only authenticated CRUD grants required for the API surface are restored.
- A policy on every table allows every operation only when the JWT app_metadata role is admin.
- Anonymous users have no grants and no policies.
- lib/coupons/import/authorization.ts delegates future import server entrypoints to the existing utils/auth/require-admin.ts; no service-role browser path was added.
- Both RPCs are SECURITY INVOKER, set a safe search path, require a non-null authenticated caller, and independently verify the same admin claim.
- Commit/rollback RPC responses are generic on operational failure. Technical reason strings remain only in admin-RLS-protected batch metadata.

## Atomic operations

public.commit_coupon_import(import_id, validation_hash):

1. Locks the import batch and requires its exact validated state/hash.
2. Changes it to committing.
3. Revalidates required values, boolean canonical forms, discount limits, store existence/activity, in-file identities, and live existing coupon identities.
4. Inserts every currently eligible row in one subtransaction, records coupon IDs and full inserted-row snapshots, then marks the batch committed.
5. On any failure, the insert subtransaction is rolled back, no partial coupon insert remains, and the batch is marked failed.

public.rollback_coupon_import(import_id):

1. Locks a committed batch and records the rollback request actor/time.
2. Refuses the operation if any inserted coupon is missing, lacks a snapshot, or differs from its import-time snapshot.
3. Deletes only coupons tied to that import in one subtransaction and marks their import rows/batch rolled back.
4. A blocked foreign key or any other delete failure rolls back the full delete and records rollback_failed; unsafe changes record rollback_unsafe.

## Pure domain layer

Created:

- lib/coupons/import/types.ts
- lib/coupons/import/normalize.ts
- lib/coupons/import/duplicates.ts
- lib/coupons/import/validate.ts
- lib/coupons/import/authorization.ts

The layer is parser-independent and provides coupon-code normalization, discount-type/value parsing, strict ISO-date parsing, boolean and non-negative integer parsing, canonical duplicate fingerprints, in-file duplicate discovery, and structured row validation results.

## Tests and validation

Created focused tests in tests/coupon-import-domain.test.ts, runnable without a new test dependency through scripts/run-coupon-import-domain-tests.cjs.

Covered:

- lowercase and whitespace code normalization;
- canonical duplicate fingerprints and duplicate codes;
- valid/malformed discount parsing;
- ISO/invalid date parsing;
- supported/malformed booleans;
- missing store/code/title;
- percentage maximum;
- fixed-discount positivity;
- expired dates.

Results:

| Check | Result |
| --- | --- |
| node scripts/run-coupon-import-domain-tests.cjs | PASS — 8/8 tests |
| npx tsc --noEmit | PASS |
| git diff --check | PASS |

## Blockers

None at the inspected live data state. The migration remains intentionally unapplied. If data changes before deployment and the migration preflight finds a duplicate or unresolved store, Phase 1 must stop for an explicit, separately approved data-reconciliation plan.
