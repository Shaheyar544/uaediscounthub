# Coupon Bulk Import — Store Resolution Engine

## Scope

Phase 3.5 adds an admin-governed, deterministic store-resolution layer to the existing CSV coupon importer. It does not create stores, modify coupon data, import the real affiliate file, change authentication, or alter migration history. The alias schema migration was subsequently deployed after an explicit production approval; it does not modify existing stores, coupons, or import records.

## Implemented

- `lib/coupons/import/stores.ts` now returns a structured store-resolution result rather than only a nullable store.
- Resolution order is deliberately narrow:
  1. approved saved alias with an exact normalized source value;
  2. exact active-store ID, slug, or display name;
  3. exact active-store `website_url` hostname (for example `www.example.ae/path` → `example.ae`);
  4. a standalone terminal ` UAE` qualifier removed, followed by the same exact comparison.
- Every automatic result must have exactly one active-store target. Multiple exact candidates are `needs_review`; no match is a `new_store_candidate`; an empty value is `unresolved`.
- No edit-distance, token-subset, brand, AI, or fuzzy matching is used.
- Staging reads approved aliases once, reads active stores once, and returns grouped resolution information with row counts alongside the bounded preview.
- The import preview now shows Auto-resolved, Needs Review, Unresolved, and New Store Candidate groups. A review collision can be explicitly approved or rejected by an admin. Saving a decision clears the staged preview so the file must be validated again before it can be committed.
- Approved alias mappings are reusable automatically on later imports.
- New Store Candidates direct administrators to the dedicated Store CSV importer, where a verified Base URL is required before a public catalog store can be created. This prevents creating coupon redirects with guessed or missing destinations.

## Alias persistence and security

`supabase/migrations/20260903190000_coupon_store_aliases.sql` adds a dedicated `coupon_store_aliases` table. It stores the original source value, normalized identity, approved active-store target (or explicit rejection), reviewer/creator, and timestamps. Its normalized alias is unique, so one source identity cannot silently point at two stores.

The table is RLS-enabled, has no anonymous access, and grants authenticated access only behind the same JWT admin policy used by the existing import foundation. The new `POST /api/admin/coupons/store-aliases` endpoint independently invokes `requireCouponImportAdmin()`, verifies an approved target is active, and refuses to overwrite an alias already approved for another store. It never creates stores or coupons.

Migration `20260903190000_coupon_store_aliases.sql` is deployed to the linked Supabase project. The remote ledger matches the local migration, and a read-only catalog query verified `coupon_store_aliases` exists with RLS enabled and the `Admin full access coupon store aliases` policy. No existing store, coupon, or import record was changed.

## Real affiliate CSV result

Source: `uae-valid-working-coupons-sept-2026.csv`

| Resolution | Distinct source values | Coupon rows | Detail |
| --- | ---: | ---: | --- |
| Auto-resolved | 3 | 15 | `Amazon UAE` exact (5), `Noon UAE` → `Noon` (7), `Sharaf DG UAE` → `Sharaf DG` (3) |
| Needs Review | 0 | 0 | No exact identity collision in the current five-store catalog |
| Unresolved | 0 | 0 | All source rows contain a store value |
| New Store Candidate | 27 | 121 | No deterministic active-store identity exists |
| **Total** | **30** | **136** |  |

This corrects the former exact-only result of five store-resolvable rows without assuming any relationship for the remaining affiliate catalog. Normal coupon validation and duplicate checks still decide how many of the 15 safely resolved rows are eligible to import.

## Files changed

- `lib/coupons/import/stores.ts`
- `lib/coupons/import/service.ts`
- `lib/coupons/import/store-aliases.ts`
- `app/api/admin/coupons/store-aliases/route.ts`
- `components/admin/coupons/CouponImportWizard.tsx`
- `supabase/migrations/20260903190000_coupon_store_aliases.sql` (deployed)
- `tests/coupon-import-domain.test.ts`

## Tests

Focused domain coverage now includes exact identity, terminal-UAE identity, website-domain identity, an approved saved alias, an unknown brand, an ambiguous exact identity, and deterministic candidate-store slug creation. These are unit/domain tests; they do not claim live database or browser E2E verification.

| Check | Result |
| --- | --- |
| `node scripts/run-coupon-import-domain-tests.cjs` | PASS — 17/17 |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |

## Limitations

- A catalog gap remains a review/onboarding task; this engine never auto-creates a store.
- The real 136-row file was analyzed but not imported.
- The pre-existing Phase 2.1 browser automation blocker remains unchanged; no browser automation was retried.
- A manually authenticated import validation/preview remains the next controlled verification step.

STORE RESOLUTION ENGINE COMPLETE
