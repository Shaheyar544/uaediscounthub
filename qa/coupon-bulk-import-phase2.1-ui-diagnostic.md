# Coupon Import Post-Upload UI Diagnostic

## Conclusion

**AUTOMATION BLOCKER CONFIRMED**

No reproducible application/runtime error was captured. The two attempts fail at the browser automation page-state boundary immediately after the native file upload action, before the browser can report whether the normal analysis response changed React state to the Mapping UI.

## Observed flow

1. A legitimate saved local Supabase session was loaded into `uae-admin` and then into a fresh isolated browser session.
2. Both sessions rendered `/en/admin/coupons` and `/en/admin/coupons/import` under the protected Admin shell.
3. The native CSV control accepted the controlled three-row file and showed the selected filename.
4. On the next page-state operation, `agent-browser` stopped returning output for `snapshot`, `get url`, and `eval`.
5. The same boundary reproduced in a fresh browser session.

No navigation, mapping screen, staging batch, staging row, coupon, or commit result was observed after the upload event.

## Static implementation trace

| Step | Implementation | Behavior |
| --- | --- | --- |
| File selection | `components/admin/coupons/CouponImportWizard.tsx`, `Input` `onChange` | Calls `analyze(event.target.files?.[0] ?? null)`. |
| Client pre-request state | `CouponImportWizard.analyze` | Stores the selected `File`, clears previous analysis/preview/error, sets `busy`, and posts `FormData` to `/api/admin/coupons/import/analyze`. No route navigation occurs. |
| API route | `app/api/admin/coupons/import/analyze/route.ts`, `POST` | Parses `request.formData()`, checks that `file` is a `File`, and calls `analyzeCouponImport`. It returns JSON only; it does not stage or insert coupons. |
| Authorization | `lib/coupons/import/authorization.ts`, `utils/auth/require-admin.ts` | Uses the existing server Supabase client, `auth.getUser()`, and immutable `app_metadata.role === 'admin'`. Successful Admin route rendering is evidence that this session was legitimate. |
| Parse and analysis | `lib/coupons/import/service.ts`, `analyzeCouponImport`; `lib/coupons/import/parse.ts`, `parseCouponCsv` | Reads bytes, performs strict UTF-8/CSV validation, parses headers and rows, and returns headers, row count, samples, and suggested mapping. It does not query/write coupons or import tables. |
| Client transition | `CouponImportWizard.analyze` | For a successful JSON response, calls `setAnalysis(result)` and `setMapping(result.suggestedMapping)`. The conditional `{analysis && !preview ...}` then renders **Map columns**. |

## Exact failure point and evidence

- **Failure point:** after `input[type=file]` upload returns successfully, before a following browser page-state read.
- **Persistent session attempt:** native upload accepted; subsequent `snapshot`, `get url`, and `eval` returned no page state.
- **Fresh `uae-admin-smoke-2-1c` attempt:** native upload accepted; the combined subsequent `wait`/`snapshot` command returned only completion markers and no accessibility tree or screenshot result.
- **Runtime logs:** existing `devserver.err.log` is empty. `devserver.out.log` contains only startup and public-route GET entries from an earlier local server run; it contains no coupon-import API error, stack trace, or uncaught runtime error.
- **Database evidence:** no `coupon_imports`, `coupon_import_rows`, or smoke-test coupon was created, consistent with the analysis endpoint being read/parse-only and the UI never reaching Stage.

## Application error assessment

No confirmed application error. The static path is coherent: a successful analysis JSON response must set `analysis` and render Mapping without client-side navigation.

One defensive gap exists but is **not proven to be the cause**: `CouponImportWizard.analyze` has no `try/catch/finally`. If `fetch` rejects or `response.json()` throws, React would retain `busy = true` and display no sanitized error. This cannot explain the unavailable browser page-state protocol by itself, and it must not be changed merely to accommodate automation without a captured application failure.

## Classification

- A. Application/runtime error: **not confirmed**.
- B. Client-state/navigation problem: **not confirmed**; the implementation has no post-upload navigation and maps a successful analysis response directly to state.
- C. Browser automation/page-state limitation: **confirmed by two identical post-upload failures across persistent and fresh browser contexts**.
- D. Environmental issue: **possible contributing factor** because the app is run by a temporary local Next.js dev server, but no server error was captured.

## Recommended next action

Use an interactive browser environment or obtain a browser-automation trace that remains responsive after native file selection, then run only the Mapping-through-cleanup portions of the smoke test. Capture the `/api/admin/coupons/import/analyze` response and browser console at that time. Do not change the application, authentication, schema, migration history, or database data based on the current evidence.

## Validation

- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

AUTOMATION BLOCKER CONFIRMED
