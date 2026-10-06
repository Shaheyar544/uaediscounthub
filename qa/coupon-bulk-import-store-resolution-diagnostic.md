# Coupon Bulk Import Store Resolution Diagnostic

## Scope

Read-only investigation of `uae-valid-working-coupons-sept-2026.csv` and the current active UAE Discount Hub stores. No store, coupon, import batch, mapping, authentication, or database data was changed.

## CSV evidence

- File: `uae-valid-working-coupons-sept-2026.csv`
- Rows: 136
- Distinct `store` values: 30
- CSV fields use human-readable regional store display names. They are not UUIDs, current site slugs, URLs, or domains.

| CSV store value | Rows | Current exact resolver | Deterministic terminal ` UAE` qualifier result |
| --- | ---: | --- | --- |
| H&M UAE | 10 | UNRESOLVED | UNRESOLVED |
| Mumzworld UAE | 10 | UNRESOLVED | UNRESOLVED |
| Namshi UAE | 8 | UNRESOLVED | UNRESOLVED |
| Bloomingdale's UAE | 8 | UNRESOLVED | UNRESOLVED |
| Styli Shop UAE | 8 | UNRESOLVED | UNRESOLVED |
| Noon UAE | 7 | UNRESOLVED | SAFE → Noon |
| VogaCloset UAE | 7 | UNRESOLVED | UNRESOLVED |
| Amazon UAE | 5 | SAFE → Amazon UAE | SAFE → Amazon UAE (already exact) |
| Ubuy UAE | 5 | UNRESOLVED | UNRESOLVED |
| Kickscrew UAE | 5 | UNRESOLVED | UNRESOLVED |
| The Entertainer UAE | 5 | UNRESOLVED | UNRESOLVED |
| Lulu Hypermarket UAE | 4 | UNRESOLVED | UNRESOLVED |
| Groupon UAE | 4 | UNRESOLVED | UNRESOLVED |
| Mothercare UAE | 4 | UNRESOLVED | UNRESOLVED |
| Crocs UAE | 4 | UNRESOLVED | UNRESOLVED |
| Party Centre UAE | 4 | UNRESOLVED | UNRESOLVED |
| Samsung UAE | 4 | UNRESOLVED | UNRESOLVED |
| Giordano UAE | 4 | UNRESOLVED | UNRESOLVED |
| Sharaf DG UAE | 3 | UNRESOLVED | SAFE → Sharaf DG |
| SHEIN UAE | 3 | UNRESOLVED | UNRESOLVED |
| Faces UAE | 3 | UNRESOLVED | UNRESOLVED |
| Riva Fashion UAE | 3 | UNRESOLVED | UNRESOLVED |
| Talabat UAE | 3 | UNRESOLVED | UNRESOLVED |
| Farfetch UAE | 3 | UNRESOLVED | UNRESOLVED |
| Nysaa UAE | 3 | UNRESOLVED | UNRESOLVED |
| HomeBox UAE | 3 | UNRESOLVED | UNRESOLVED |
| Nayomi UAE | 2 | UNRESOLVED | UNRESOLVED |
| The Outnet UAE | 2 | UNRESOLVED | UNRESOLVED |
| Centrepoint UAE | 1 | UNRESOLVED | UNRESOLVED |
| Hotels.com UAE | 1 | UNRESOLVED | UNRESOLVED |

## Current active stores

| ID | Name | Slug |
| --- | --- | --- |
| `63a7593f-9541-4286-8186-8247282a438a` | Amazon UAE | `amazon-ae` |
| `96ebf504-9c8b-4a8d-81c1-e97217c9a066` | Carrefour | `carrefour` |
| `e2ff8e55-e3b4-43db-b169-96ac36cd6483` | Jarir | `jarir` |
| `7edda798-f91d-4694-839c-09719872dfc2` | Noon | `noon` |
| `343f99b9-8fb8-42f0-9c1b-778f26a5b5db` | Sharaf DG | `sharaf-dg` |

The importer currently accepts exactly one normalized match across these active `id`, `name`, and `slug` identities. Normalization allows case, whitespace, underscore, and hyphen differences; it does not remove regional words.

## Matching results

| Category | Store values | Rows |
| --- | ---: | ---: |
| SAFE with current supported identity | 1 (`Amazon UAE`) | 5 |
| UNRESOLVED with current supported identity | 29 | 131 |
| Additional SAFE rows under a deterministic terminal-`UAE` qualifier rule | 2 (`Noon UAE`, `Sharaf DG UAE`) | 10 |
| Still UNRESOLVED after that narrowly scoped rule | 27 | 121 |

The observed import result—4 valid and 1 duplicate—is consistent with the five exact `Amazon UAE` rows: the resolver does not resolve the other 131 rows, and one of the Amazon identities is already a duplicate.

## Root cause

The file belongs to a broader affiliate-source store catalog than the current UAE Discount Hub catalog. It contains human-readable regional display names for 30 brands, while the active site catalog currently contains only five stores. This is not a UUID/slug format mismatch and not a default-store problem.

`Noon UAE` and `Sharaf DG UAE` are the only non-exact values that can be mechanically tied to exactly one active current store after removing the explicitly terminal region qualifier. All other brands lack a current active-store record, so mapping them would be speculative.

## Recommended safe fix

Do not add fuzzy matching or auto-create stores.

If the product decision is to accept the common regional display-name convention, make the smallest targeted domain change in `lib/coupons/import/stores.ts`:

1. Try the existing exact normalized ID/name/slug match first.
2. Only if it fails, remove a standalone terminal ` UAE` qualifier from the source value.
3. Re-run the same exact normalized identity comparison.
4. Resolve only when exactly one active store matches; otherwise retain the existing unresolved-store error.

This deterministic alias rule would safely resolve 15 of 136 rows in this file, including the five rows already resolved today. It must not be generalized into brand or similarity matching. The remaining 121 rows require explicit creation/approval of their stores in the UAE Discount Hub catalog before they can be imported.

## Validation

- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

STORE RESOLUTION DIAGNOSED
