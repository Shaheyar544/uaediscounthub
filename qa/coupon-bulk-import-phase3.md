# Coupon Bulk Import — Phase 3 Production Hardening

## Scope

Phase 3 hardens the existing CSV importer for realistic affiliate exports. It does not alter authentication, the manual Add Coupon flow, database schema, migration history, RLS, RPCs, or public coupon pages. No browser retry was performed; Phase 2.1 remains **AUTOMATION BLOCKER CONFIRMED**.

## Files changed

- `components/admin/coupons/CouponImportWizard.tsx`
- `lib/coupons/import/normalize.ts`
- `lib/coupons/import/parse.ts`
- `lib/coupons/import/service.ts`
- `lib/coupons/import/stores.ts` (new)
- `lib/coupons/import/types.ts`
- `lib/coupons/import/validate.ts`
- `tests/coupon-import-domain.test.ts`

No dependency, migration, database, RLS, RPC, auth, or manual coupon CRUD file was changed.

## Affiliate-file compatibility

Safe, deterministic alias suggestions now include:

- Store: Store, Store Name, Merchant, Merchant Name, Retailer, Brand.
- Coupon code: Code, Coupon Code, Promo Code, Promotion Code, Voucher Code, Discount Code.
- Title: Title, Coupon Title, Offer, Deal, Description, Offer Title.
- Discount value: Discount, Discount Value, Discount Amount, Offer Value, Value, Amount.
- Expiry: Expiry, Expiry Date, Expiration, Expires At, End Date, Valid Until.

Headers are normalized for case, whitespace, `_`, `.`, and `-`. Suggestions are accepted only when one unclaimed source header is an exact alias match. Competing title-like headers are deliberately left unmapped, requiring the administrator to choose; the importer never guesses an ambiguous mapping.

## Normalization and validation

- Coupon identity remains `trim + uppercase`; interior code characters are not silently removed, preserving the database canonical identity.
- Empty optional strings normalize to `null`.
- Discount values accept explicit `%`, AED, Dh/Dhs, and `د.إ` forms, plus thousands separators.
- Discount type accepts common explicit labels. If no type column is mapped, the importer can infer percent only from an explicit percent marker and fixed only from an explicit UAE currency marker. Bare numeric values remain invalid because they are ambiguous.
- Percent/currency contradictions are invalid (for example, `AED 20` with a percent type).
- Dates accept ISO, unambiguous numeric day/month or month/day forms, `YYYY/MM/DD`, and English named-month forms. Ambiguous numeric dates such as `03/02/2030` remain invalid.
- An inferred discount type is retained as a row warning; it does not make the row ineligible.

## Store matching

`lib/coupons/import/stores.ts` resolves only one exact normalized identity across active store ID, slug, and name. Matching is case-insensitive and tolerates whitespace, underscore, and hyphen differences. Multiple matches and unknown stores resolve to `null`, which produces the existing row-level unresolved-store error. No fuzzy or nearest-name matching is used.

## Duplicate behavior

The canonical identity remains `store_id + normalized coupon code`.

- In-file duplicate fingerprints remain skipped as `duplicate_in_file`.
- Database duplicate detection remains a batched active-store query followed by canonical fingerprint comparison; it does not query once per CSV row.
- The deployed expression unique index and atomic commit RPC remain the final race-safe database enforcement.
- Existing coupons are never updated or overwritten.

## Preview and error handling

The wizard now makes the actual commit count explicit: “N coupons will be created.” Preview and result summaries include valid, duplicate, invalid, and warning-row counts. Per-row inferred-type warnings appear in the existing Problems column.

The upload, stage, and commit client requests now use `try/catch/finally`, so an interrupted request clears its loading state and returns a sanitized user-facing error instead of leaving the wizard permanently busy. This is an importer reliability improvement, not a workaround for the Phase 2.1 automation limitation.

## Sample CSV template

The upload area now includes a **Download Sample CSV** action and the helper text “Not sure about the format? Download our sample CSV.” The application generates the download locally as a UTF-8 CSV (with BOM); no external URL or server request is required.

The sample uses every canonical import field, three clearly fake `TEST...` coupon codes, both supported discount types (`percent` and `fixed`), and the accepted ISO `YYYY-MM-DD` expiry format. Its `Example Store UAE` value is intentionally fictitious, so administrators must replace it with an exact active store name before importing the template.

## Large-file safety

- Existing server-side parser limits remain: 5 MB, 10,000 rows, 60 columns, and 10,000 characters per cell.
- Parsing and validation remain server-side; browser mapping and preview are not authorization or validation boundaries.
- Preview remains bounded to the first 100 rows.
- Existing coupon lookup remains batched by participating stores, not per import row.
- Staging `coupon_import_rows` is now inserted in 500-row chunks to avoid a single oversized PostgREST payload. If a staging chunk fails, the batch is marked `failed` and cannot be committed; no coupon insertion occurs before the atomic commit RPC.
- Commit remains the already-deployed all-or-nothing RPC. No background queue was introduced because the existing bounded CSV limits and atomic commit foundation make it unnecessary for this phase.

## Security verification

- Analysis, stage, and commit still independently use the existing admin authorization path.
- The client does not determine validity, authorization, duplicates, or final insertion.
- Import staging retains admin-only RLS from the deployed foundation.
- The browser receives no service-role credential.
- No change weakens RLS, RPC authorization, or canonical database uniqueness.

## Tests

`tests/coupon-import-domain.test.ts` now covers 13 focused domain scenarios, including:

- standard rows, whitespace, and upper/lowercase code normalization;
- percentage and fixed discounts, including AED/Dh/Arabic currency text;
- invalid discount values and percent/currency contradictions;
- ISO, unambiguous numeric, and named-month expiry dates, plus ambiguous/invalid dates;
- empty optional values and Arabic/English text;
- missing store/title/code and unknown/ambiguous store resolution;
- in-file canonical duplicates and a simulated existing-coupon canonical lookup;
- common affiliate headers, including Promotion Code, Merchant Name, Coupon Title, Offer Value, and Valid Until;
- safe refusal to auto-map competing title columns.
- locally generated sample CSV headers, row count, fake coupon codes, supported discount types, and ISO expiry values.

These are domain/unit tests only. No database integration test is claimed, and no end-to-end browser validation is claimed.

## Validation results

| Check | Result |
| --- | --- |
| `node scripts/run-coupon-import-domain-tests.cjs` | PASS — 13/13 |
| `npx tsc --noEmit` | PASS |
| `git diff --check` | PASS |

## Remaining limitations

- CSV only; XLS/XLSX and saved mapping profiles remain later-phase work.
- Import history and rollback UI remain later-phase work; the deployed rollback RPC is unchanged.
- The real authenticated E2E browser smoke test remains manually unverified because Phase 2.1 established an automation blocker after native file selection.
- A production-scale importer beyond the current 5 MB/10,000-row bounds may later need background processing, but this phase intentionally does not introduce it.

PHASE 3 COMPLETE
