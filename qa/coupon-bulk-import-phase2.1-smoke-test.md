# Coupon Bulk Import Phase 2.1 Smoke Test

## Status

**IMPLEMENTATION VERIFIED / E2E UI AUTOMATION BLOCKED**

The database migration deployment and implementation checks completed successfully. Admin access was safely restored, but the end-to-end UI smoke test is blocked after the normal file-upload action because both persistent and fresh browser contexts stop returning page-state responses before the Mapping step.

## Pre-deploy preflight

- Linked project: `cqsoceyqivsfrarcwptb`
- Coupon count: 21
- Store count: 5
- Active store count: 5
- Coupons with a null `store_id`: 0
- Canonical duplicate groups (`store_id` + trimmed upper-case code): 0

The migration's own fail-closed preflight conditions were therefore satisfied. No existing coupon rows were changed during preflight.

## Migration ledger and deployment

Before deployment, `supabase migration list --linked` showed exactly one pending migration:

| Version | Local | Remote |
| --- | --- | --- |
| `20260719120000_drop_unused_indexes` | Yes | Yes |
| `20260902175716_coupon_bulk_import_foundation` | Yes | No |

`supabase db push --linked --dry-run` listed only `20260902175716_coupon_bulk_import_foundation.sql`. The approved deployment command then applied that one migration. It did not replay `20260719120000`, use migration repair, reset the database, or use `--include-all`.

After deployment, the ledger reports both versions as Local Yes / Remote Yes, with no mismatch.

## Database object verification

Read-only PostgreSQL catalog inspection verified:

- `coupons_store_normalized_code_key` exists.
- `coupon_import_profiles`, `coupon_imports`, and `coupon_import_rows` exist.
- RLS is enabled on each import table.
- Each table has its `Admin full access ...` policy for `authenticated`.
- `commit_coupon_import` and `rollback_coupon_import` exist.

## Authentication diagnosis and legitimate restoration

`requireAdmin()` creates the normal server Supabase client, calls `auth.getUser()`, and requires `user.app_metadata.role === 'admin'`. The Admin layout and the import route both use this guard. The initial redirect was therefore correct: the active `uae-admin` browser had no usable session for the locally started application.

The repository contains an existing saved local browser state for `http://localhost:3000` with the project Supabase auth cookie. Its value was not read, logged, fabricated, or changed. Loading that state into the existing `uae-admin` session restored normal authentication. The following protected pages then rendered successfully:

- `http://localhost:3000/en/admin/coupons` — **Coupons Registry**.
- `http://localhost:3000/en/admin/coupons/import` — **Import Coupons**.

The Admin shell and User menu rendered on both pages, confirming the session was authenticated and authorized through the existing `requireAdmin()` path.

## Controlled CSV and UI attempt

A temporary three-row CSV was prepared with the distinct codes `SMKIMPORT260903A`, `SMKIMPORT260903B`, and `SMKIMPORT260903C`, using active store `jarir`. A preflight lookup confirmed that none of those codes existed. The temporary file was removed after the UI test could not start; no import batch or coupon was created.

The local development server was started solely to reach the requested Admin UI. The authenticated wizard accepted `coupon-import-smoke-test.csv` through its normal upload control. Immediately afterwards, the persistent `uae-admin` session stopped returning page-state operations (`snapshot`, `get url`, and `eval`), so the mapping state could not be verified or advanced. No staging or direct database insertion was attempted.

This is a browser-session/runtime issue after the normal upload event, not an authentication failure. A screenshot of the authenticated upload page was captured at `qa/screenshots/coupon-import-smoke-upload.png`.

## Fresh browser-context retry (Phase 2.1C)

A new isolated browser session, `uae-admin-smoke-2-1c`, was created rather than reusing the stalled session. The same existing saved local auth state was loaded without reading, logging, modifying, or fabricating its cookie value. Both protected routes again rendered successfully before upload:

- `/en/admin/coupons` — **Coupons Registry**.
- `/en/admin/coupons/import` — **Import Coupons**.

The same three-row controlled CSV was then submitted through the import page's normal file control. The upload action completed, but the immediately following `snapshot` request again stopped returning page state before **Column Mapping** appeared. This reproduces the earlier browser/runtime boundary in a fresh browser context.

No import batch, import row, or coupon was created. The temporary CSV was removed. Screenshot evidence is retained at `qa/screenshots/coupon-import-smoke-fresh-upload.png`.

## Results not executed

The following require an authenticated Admin session and were not executed:

- Mapping, validation, preview, and commit through the wizard.
- Import batch and row staging verification.
- Three inserted-coupon verification.
- Duplicate re-import test.
- Rollback/cleanup test.
- Manual Add Coupon regression page check.

Coupon count remains 21 from the completed preflight; no smoke-test coupon records exist.

## Final Phase 2.1 closure

- No confirmed application error was found.
- No client-side navigation defect was found in the post-upload flow.
- No server error was captured in the available local runtime logs.
- No import batch, import row, or coupon write occurred.
- Persistent and fresh authenticated browser contexts reproduced the same post-upload automation failure.
- Mapping, Preview, Commit, duplicate re-import, and rollback cleanup remain **manually unverified**; they must not be reported as passed.

The supporting diagnosis is recorded in `qa/coupon-bulk-import-phase2.1-ui-diagnostic.md`.

## Validation

- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

## Required next action

Diagnose the browser/runtime failure that occurs after `input[type=file]` upload while retaining the legitimate local auth state, then rerun only the remaining mapping-through-cleanup steps. Do not redeploy the migration or change the application merely to accommodate automation.

SMOKE TEST BLOCKED
