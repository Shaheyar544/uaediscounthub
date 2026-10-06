# Coupon Bulk Import Architecture

Status: discovery and proposed architecture only. No application code, dependency, schema, route, or UI change was made.

## 1. Current coupon architecture

The current coupon capability is a conventional admin CRUD surface backed directly by Supabase:

- Admin registry: `app/[locale]/admin/coupons/page.tsx` queries `coupons` with `stores(name, slug)`, calculates summary metrics in memory, and renders a table with verify, enable/disable, and delete actions.
- Manual create: `app/[locale]/admin/coupons/new/page.tsx` renders a server-rendered form. It requires a selected active store, code, English title, discount type, and discount value; optional fields include Arabic title, description, minimum order value, expiration, active, verified, and exclusive flags.
- Server actions: `app/[locale]/admin/coupons/actions.ts` creates, verifies, toggles, and deletes coupons, then revalidates the admin and public coupon paths.
- Public consumption: public coupon views select active coupons; `app/api/coupons/verify` marks a working coupon verified and increments `current_uses`; `app/api/coupons/track` increments clicks through an RPC when available and records an affiliate click.
- There is no coupon edit route/client, bulk upload UI, parser, staging state, source-file record, duplicate policy, import result, import history, rollback, or saved column-mapping profile.

Manual Add Coupon must remain a separate, unchanged path. Bulk import should share normalization and validation functions with manual create over time, but must not replace the form.

## 2. Database/schema findings

The repository baseline in `supabase/schema.sql` defines `coupons` with:

- `id` UUID primary key
- `store_id` → `stores(id)` (`ON DELETE CASCADE`)
- `code`, `title_en`, optional Arabic/description fields
- discount fields, timestamps, active/verified state, and a usage counter

The deployed/exported shape is broader than that baseline. `exports/supabase/coupons.json` shows the active fields:

```text
id, store_id, code, title_en, title_ar, description_en, description_ar,
discount_type, discount_value, min_order_value, max_uses, current_uses,
is_verified, is_exclusive, expires_at, is_active, click_count,
submitted_by, created_at, product_id, source
```

Migration `20260318000001_price_history_pros_cons.sql` adds `product_id` and `source`. The current schema file is therefore not a complete representation of the deployed coupon table and must be reconciled before a new migration is authored.

Important gaps for importing:

- No database uniqueness constraint/index protects the business identity of a coupon.
- `store_id` is nullable in the baseline schema, while manual creation logically requires it. Bulk import should require a resolved active store for every insert.
- No import batch, import row, mapping profile, source-file, rollback, or fingerprint fields/tables exist.
- Existing `api_sync_logs` records generic sync metadata but is not suitable for row-level coupon import audit, preview, or rollback.

## 3. Existing API findings

### Admin and authorization

- `app/[locale]/admin/layout.tsx` calls `requireAdmin()` and redirects unauthenticated/non-admin page requests.
- `utils/auth/require-admin.ts` obtains the authenticated user from the server Supabase client and checks `app_metadata.role === 'admin'` through `hasAdminRole`.
- The middleware likewise redirects non-admin page traffic away from locale admin routes.
- Coupon RLS is enabled in the stabilization script. Later migrations grant coupon writes to authenticated users only when the JWT `app_metadata.role` is `admin`.

The existing coupon server actions use `createClient()` directly and rely on the page boundary/RLS; they do **not** explicitly call `requireAdmin()`. A new bulk-import route or server action must explicitly call `requireAdmin()` itself. Do not rely on a rendered admin page as authorization for a mutation endpoint.

### Existing import/upload patterns

- `app/api/admin/import-deals/route.ts` is an external JSON endpoint secured with `IMPORT_API_KEY` and uses `createAdminClient()` (service role). It processes records one by one and can leave partial results; it is not appropriate as a template for an all-or-nothing admin coupon import.
- `app/api/admin/import-product/route.ts` is another external, API-key-protected JSON importer. It has per-item upsert behavior and non-fatal side effects.
- `app/api/upload/image/route.ts` is an authenticated admin `multipart/form-data` image route with MIME/size limits and R2 cleanup. It is the closest existing upload-security pattern, but it is image-specific and not a reusable CSV/XLSX ingestion utility.
- `lib/r2-storage.ts` provides server-side R2 upload/delete primitives. There is no existing private spreadsheet upload flow, generic file parser, CSV/XLSX package, queue, or import worker.

## 4. Proposed import architecture

Use a staged, auditable import domain rather than inserting from the browser or inserting while parsing.

```text
Admin upload
  → authenticated server ingestion
  → parse workbook/CSV to raw rows
  → choose mapping/profile
  → server normalization + validation
  → store import rows + duplicate outcomes
  → preview / explicit commit
  → one transactional database commit
  → result and durable history
  → optional batch rollback
```

Recommended boundaries:

- **Client wizard:** file selection, sheet selection, column mapping, preview filters, and explicit confirmation only. It must not decide a row is valid or perform direct inserts.
- **Server import service:** pure parsing adapters, normalization, mapping, validation, duplicate lookup, preview assembly, and typed result construction. Keep this in a coupon-specific service rather than expanding the external deal importer.
- **Database staging/audit:** immutable import/batch rows and row-level outcomes.
- **Commit RPC/function:** one database transaction that revalidates eligible staged rows and inserts all selected rows, or inserts none. It is the final concurrency and authorization boundary.

## 5. UI/UX flow

1. **Upload:** Add an `Import coupons` action next to the existing `Add Coupon` action. Accept `.csv`, `.xlsx`, and `.xls` only; show size/row limits and a downloadable canonical template.
2. **Parse:** Display file name, sheet choices for workbooks, detected headers, row count, and parser warnings. Do not enable commit yet.
3. **Column mapping:** Map source headers to canonical fields. Auto-suggest aliases (for example `coupon`, `promo code`, `voucher`, `merchant`, `shop`, `discount`, `valid until`) and require mappings for code, title, discount, and store/default store.
4. **Normalize:** Show the selected normalizers: code uppercasing/trim, currency/percent parsing, date parsing, boolean coercion, and store resolution.
5. **Validate and duplicate detect:** Present summary badges: valid, invalid, duplicate-in-file, duplicate-existing, skipped, and warnings. Provide downloadable/visible row-level errors and filters.
6. **Preview:** Show only a bounded preview (for example first 100 rows), plus representative errors; the full result remains server-side. Require an explicit `Commit N valid coupons` confirmation.
7. **Commit:** Disable repeated submission, show progress/state, and return one immutable batch result. Do not let a user commit a stale preview after its validation snapshot expires.
8. **Result:** Show inserted, skipped, duplicates, invalid, failed/rolled-back counts, a row report, and links to registry/history.
9. **History:** Provide batch status, source/profile, actor, timestamps, totals, error report, and a guarded rollback action.

## 6. Validation rules

Validate on the server twice: once before preview and again inside commit. Suggested canonical row contract:

| Field | Requirement / normalization |
| --- | --- |
| Store | Either a mapped store name/slug/id resolving to exactly one active store, or one explicit default store chosen by the admin. Ambiguous/inactive/missing stores are invalid. |
| Code | Required; Unicode-normalize, trim, collapse accidental interior whitespace only if business-approved, uppercase; reject empty/control characters and enforce a sensible max length. |
| Title English | Required after trim; enforce length. Arabic title/description remain optional. |
| Discount type | Required; map aliases `%`, `percentage`, `percent` to `percent`; map `AED`, `fixed`, `amount` to `fixed`; reject unknown values. |
| Discount value | Required finite positive decimal; percent must be >0 and <=100 unless the business intentionally permits more; fixed value must be a positive AED amount. |
| Min order / max uses | Optional non-negative numeric/integer values. |
| Dates | Parse locale-independent ISO/Excel date safely; reject invalid timestamps and optionally flag expired-on-import rows. Validate start ≤ expiry if starts are later supported. |
| Flags | Parse canonical booleans (`true/false`, `yes/no`, `1/0`); default imports to active=false or verified=false unless the UI requires deliberate approval. |
| Source | System-controlled source label or profile source key, never trusted raw input. |

Rows with validation errors are not commit-eligible. The product relationship should be optional and only accepted as a resolvable existing product id/SKU; imports must never create products implicitly.

## 7. Duplicate strategy

Use both preflight detection and a database guarantee.

1. **Canonical key:** `store_id + normalized_code`, where normalized code is the same uppercased/trimmed value used for insertion.
2. **Within-file duplicates:** build a map of canonical keys while normalizing. Mark every collision with its first row number before querying the database.
3. **Existing duplicates:** batch query the existing coupons by resolved stores and normalized codes. Do not issue one query per row.
4. **Concurrent commits:** add a unique expression index (or a stored normalized-code column plus unique constraint) on `(store_id, normalized_code)`. This remains authoritative if another admin imports between preview and commit.
5. **Policy:** default to **skip duplicate** and report its existing coupon id/row. An explicit future `update existing` mode can be added only with field-level conflict policy and a separate audit model; do not silently overwrite existing coupons.

Recommended migration shape after existing data is normalized and reviewed:

```sql
create unique index coupons_store_normalized_code_key
  on public.coupons (store_id, upper(btrim(code)))
  where store_id is not null;
```

The importer must still reject blank or unresolved stores; the partial index is a safety net for legacy nullable rows, not permission to import them.

## 8. Import transaction strategy

Never insert while parsing or while page-by-page validation is running.

- Create an import batch and staging rows first. Preview only rows with `status = valid` and no duplicate key.
- At commit, call a single SQL/RPC routine with the batch id and an optimistic validation version/hash.
- The routine locks the batch, checks the caller is an admin, confirms batch state is `validated`, rechecks store activity and duplicate keys, inserts all eligible coupon rows, writes inserted coupon ids back to import rows, creates audit totals, and transitions batch to `committed` in one transaction.
- Any unexpected database error rolls back the entire commit; the batch becomes `failed` with a sanitized error summary and no coupons from that commit exist.
- Rows deliberately classified as invalid/duplicate/skipped are never attempted; the final result clearly distinguishes them from a transaction failure.

Use a default `SECURITY INVOKER` function exposed only to `authenticated`, with RLS and an explicit `auth.jwt() -> app_metadata ->> 'role' = 'admin'` check. Do not use the browser/service-role client for commit. If a security-definer function becomes necessary, place it outside the exposed schema, set a safe `search_path`, revoke `PUBLIC` execute, grant narrowly, and retain the explicit admin check.

## 9. Error handling

- Reject MIME/type mismatch, encrypted/corrupt workbook, oversized files, parser limits, missing headers, unsupported encoding, and excessive rows before staging a commit.
- Persist structured per-row errors (`field`, `code`, `message`) and warnings, never only a single generic alert.
- Sanitize user-facing errors; keep technical stack/database diagnostics in server logs and batch metadata only where safe.
- Make parsing idempotent using a file SHA-256 plus batch id; warn when the same content/profile was already committed.
- Use retry only for upload/parse transient failures. A failed commit must not auto-retry without rechecking the batch lock/version.
- Provide error export as CSV generated from staged row outcomes, with no secrets or service-role information.

## 10. Import history and rollback strategy

Add immutable import metadata and row records:

### `coupon_imports`

`id`, `status`, `source_file_name`, `source_file_hash`, optional private object key, `source_type`, `sheet_name`, `mapping_profile_id`, `mapping_json`, `validation_version`, total/valid/invalid/duplicate/skipped/inserted counts, `created_by`, `created_at`, `validated_at`, `committed_at`, `rolled_back_at`, `rollback_by`, and a sanitized error summary.

### `coupon_import_rows`

`id`, `import_id`, `row_number`, `raw_row` JSONB, `normalized_row` JSONB, canonical duplicate fingerprint, status, errors/warnings JSONB, `existing_coupon_id`, `inserted_coupon_id`, and timestamps.

Rollback must be batch-scoped and transactional. It may only delete coupons whose `id` is listed as inserted by that batch and which have not been manually changed since import (compare `updated_at`/revision if added). If any protected row cannot be rolled back, abort by default and report it; do not partially delete. Record the rollback outcome and prevent a second rollback. A future “force rollback” requires a separate elevated confirmation/audit policy.

## 11. Saved mapping profile strategy

Create `coupon_import_profiles` for recurring affiliate sources:

- owner/admin scope, profile name, source label, optional expected headers/signature, default store id, mapping JSON, transform settings, version, active flag, and created/updated metadata.
- A profile stores column mapping and normalizer options only. It never stores uploaded data, credentials, or an authorization bypass.
- Header matching should recommend a profile but require visible confirmation when a source changes.
- Version profiles or snapshot the exact mapping JSON into each `coupon_imports` row so historical results remain reproducible.

## 12. Files/components that should be created

Suggested names; final placement should follow the current route/component conventions:

- `app/[locale]/admin/coupons/import/page.tsx` — protected import entry/wizard route.
- `components/admin/coupons/CouponImportWizard.tsx` — client state machine only.
- `components/admin/coupons/CouponImportUpload.tsx`
- `components/admin/coupons/CouponColumnMapper.tsx`
- `components/admin/coupons/CouponImportPreview.tsx`
- `components/admin/coupons/CouponImportResults.tsx`
- `components/admin/coupons/CouponImportHistory.tsx`
- `components/admin/coupons/coupon-import-types.ts` — canonical row, mapping, validation, and result types.
- `lib/coupons/import/parse.ts` — CSV/XLSX adapters.
- `lib/coupons/import/normalize.ts` — pure field normalization.
- `lib/coupons/import/validate.ts` — pure schema/business validation.
- `lib/coupons/import/duplicates.ts` — batched duplicate lookup and fingerprints.
- `lib/coupons/import/service.ts` — authenticated orchestration and staging.
- `app/api/admin/coupons/import/upload/route.ts` — authenticated file intake/parse initiation, if a route handler is preferred for multipart uploads.
- `app/api/admin/coupons/import/[importId]/route.ts` — authenticated batch status/detail.
- `app/api/admin/coupons/import/[importId]/commit/route.ts` — authenticated explicit commit, or equivalent server action.
- `app/api/admin/coupons/import/[importId]/rollback/route.ts` — authenticated guarded rollback.
- One generated Supabase migration for new tables, indexes, RLS, and commit/rollback functions.

## 13. Existing files that should be modified

- `app/[locale]/admin/coupons/page.tsx` — add a link/button to import and optionally an import-history entry point; retain Add Coupon.
- `app/[locale]/admin/coupons/actions.ts` — optionally factor shared manual-form normalization/validation, but do not couple manual form mutation to batch processing.
- `app/[locale]/admin/coupons/new/page.tsx` — no required functional change; optionally link back to import later.
- `components/admin/AdminSidebar.tsx` or `components/admin/AdminCommandCenter.tsx` — only if the chosen navigation pattern requires a discoverable import/history destination.
- `utils/auth/require-admin.ts` — reuse as-is for every new importer mutation; do not weaken it.
- `utils/supabase/admin.ts` — do not use in the browser-facing importer. It may remain unused by this feature.

## 14. Required database changes

Required before release:

1. Reconcile canonical coupon schema with the deployed export/migrations.
2. Add a duplicate-protection index/constraint based on resolved store and normalized code, after data cleanup.
3. Add `coupon_imports`, `coupon_import_rows`, and `coupon_import_profiles` tables, foreign keys, efficient status/import indexes, and optional private-source-object reference.
4. Add admin-only RLS policies for all three new tables. Non-admin users must not read raw affiliate files, mappings, or row error data.
5. Add atomic commit and rollback database functions/RPCs with narrow execute grants, explicit admin checks, idempotency/version checks, and audit transitions.
6. Consider `updated_at`/revision on coupons if absent in the actual deployed schema; safe rollback needs to detect post-import manual edits.

No database change should be applied until the live schema is pulled/verified against the export and current migration state.

## 15. Required dependencies, if any

None are currently installed for CSV/XLSX parsing; `package.json` has no direct CSV, SheetJS/XLSX, ExcelJS, or modern multipart tabular parser.

Recommended dependency decision for implementation:

- **CSV:** use a hardened streaming parser such as `csv-parse` for bounded-memory CSV handling.
- **XLSX/XLS:** use a maintained workbook parser with a server-side streaming/low-memory option where feasible (evaluate `exceljs` streaming reader against current Next.js runtime constraints). SheetJS `xlsx` is viable for a small-to-medium, bounded first release but generally buffers workbooks and is not sufficient alone for the large-file design.

Pin exact versions and commit the lockfile only when implementation starts. Do not install anything during architecture work.

## 16. Security considerations

- Require `requireAdmin()` in every upload, preview, commit, history, result-download, profile, and rollback mutation/read endpoint.
- Do not trust client mapping, normalized rows, duplicate status, store ids, MIME types, filenames, or file extension. Revalidate server-side and at commit.
- Keep service-role credentials server-only. The browser must never receive `SUPABASE_SERVICE_ROLE_KEY` or import API keys.
- Enforce file-size, row-count, compression-ratio, sheet-count, cell-length, and parser-time limits to mitigate zip bombs and resource exhaustion.
- Store source files privately with restrictive RLS/access control, or retain only hashes and staged raw rows if original file retention is unnecessary. Define retention/deletion policy.
- Sanitize spreadsheet values before rendering to prevent formula/CSV injection in previews and exported error reports (prefix dangerous values beginning with `=`, `+`, `-`, or `@` when producing downloadable CSV).
- Use unique constraints plus transactional revalidation for race-safe duplicate handling.
- Audit actor, timestamps, profile, source hash, commit, and rollback. Do not log file contents, auth cookies, or credentials.

## 17. Large-file considerations

- Set explicit synchronous UI limits for initial release (for example row/file limits chosen from hosting/runtime measurements), then route larger imports to asynchronous processing.
- CSV should stream rows/chunks rather than load the entire file in browser memory.
- XLSX should be parsed server-side with bounded memory; read only the selected sheet and relevant cells.
- Store raw/normalized rows in batches, perform duplicate lookups in chunks, and use bulk inserts only inside the atomic commit path.
- Do not send every normalized row back to the browser. Return aggregate counts, paginated row results, and a capped preview.
- For production-scale imports, introduce a durable job/queue worker and resumable progress state; do not rely on a single Next.js request lasting for a large workbook.
- Apply rate limits per admin and cap concurrent active imports.

## 18. Recommended implementation phases

1. **Schema reconciliation and security foundation:** inspect live coupon schema, clean legacy duplicate/nullable-store data, add the unique business key, batch/profile/row tables, RLS, and transactional RPC design.
2. **Pure domain layer:** canonical field types, normalizers, validators, store resolver, duplicate service, and unit tests using representative affiliate fixtures.
3. **CSV import MVP:** authenticated upload, mapping, server validation, staged preview, atomic commit, result report, and manual Add Coupon regression coverage.
4. **XLSX and saved profiles:** sheet selection, column aliases, profile save/select/versioning, and profile snapshots in history.
5. **History and rollback:** batch list/detail, guarded atomic rollback, audit/report download, retention policy.
6. **Large-import hardening:** limits, streaming/chunking, queue/worker integration, observability, performance tests, and concurrency/race tests.

The import must not be released before phases 1–3 are complete. In particular, direct browser inserts, per-row commits, or reuse of the external `import-deals` pattern would violate the all-or-nothing, duplicate-safe, auditable requirements.
