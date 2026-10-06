# Coupon Bulk Import — Phase 2 CSV MVP

## Files changed

- app/[locale]/admin/coupons/page.tsx
- app/[locale]/admin/coupons/import/page.tsx
- app/api/admin/coupons/import/analyze/route.ts
- app/api/admin/coupons/import/stage/route.ts
- app/api/admin/coupons/import/[importId]/commit/route.ts
- components/admin/coupons/CouponImportWizard.tsx
- lib/coupons/import/parse.ts
- lib/coupons/import/service.ts
- lib/coupons/import/types.ts
- package.json and package-lock.json

## CSV parser and upload security

The MVP uses pinned csv-parse 7.0.2, server-side only. Both analysis and staging independently validate the uploaded File rather than trusting the filename, browser MIME type, extension, client mapping, or client row state.

CSV limits are 5 MB, 10,000 rows, 60 columns, and 10,000 characters per cell. The parser requires valid UTF-8, rejects empty/binary/ZIP input, rejects malformed quotes and unequal column counts, supports UTF-8 BOM and quoted comma fields, and requires non-empty unique headers.

## Mapping and validation

The wizard calls a protected analysis endpoint to return headers, five source samples, row count, and safe alias-based mapping suggestions. It exposes editable mappings, requires Code, English Title, Discount Type, Discount Value, and either Store mapping or an explicitly selected active default store.

At staging, the server reparses the original file, validates mappings, resolves stores only against active stores, applies the Phase 1 normalizers/validator, and creates canonical store/code fingerprints. No browser validation is trusted.

## Duplicate and staging behavior

In-file fingerprints are computed once. Existing coupon checks are batched by store id, never one database request per CSV row. Existing and in-file duplicates are staged with skip outcomes; they are not overwritten or inserted.

A validated batch includes filename, SHA-256 source hash, mapping snapshot, validation version/hash, actor, counts, and bounded preview. Staging stores raw/normalized rows, errors, duplicate outcomes, and existing coupon references. It never writes coupons.

## Commit behavior

The commit endpoint requires admin authorization and invokes the Phase 1 commit_coupon_import RPC with the staged batch id and validation hash. The browser does not insert coupons directly. The RPC is responsible for the final lock, revalidation, duplicate-race check, and atomic insert.

## UI workflow

Coupons Registry now has a locale-aware Import Coupons entry alongside Add Coupon. The import route is explicitly protected with requireAdmin and presents an upload, mapping, server-preview, explicit Import N Coupons action, and success result with batch reference, View Coupons, and Import Another File actions.

The table is bounded to the first 100 staged rows and internally scrolls horizontally when necessary.

## Validation

- npm test: not available; this repository has no test script.
- node scripts/run-coupon-import-domain-tests.cjs: PASS, 8/8
- npx tsc --noEmit: PASS
- git diff --check: PASS
- Focused authenticated browser presentation checks: Import Coupons route renders an H1 and upload control at 1440x900, 768x1024, and 390x844. Screenshots are under qa/screenshots.

The Phase 1 migration remains unapplied by instruction, therefore an actual live stage/commit transaction was not exercised against production data.

## Manual coupon regression

The manual Add Coupon page and action were not changed. The registry action remains present alongside the new import entry.

## Remaining Phase 3 work

- XLS/XLSX parser and sheet selection
- saved mapping profiles
- import history and detail views
- rollback UI
- asynchronous queue/large-file processing
- downloadable sanitized error CSV
- database-backed integration/RLS/RPC tests after the Phase 1 migration is deployed to a non-production test database
