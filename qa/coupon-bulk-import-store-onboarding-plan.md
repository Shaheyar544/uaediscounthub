# Coupon Bulk Import Store Onboarding Plan

## Scope and safety posture

This is a read-only planning document based on `uae-valid-working-coupons-sept-2026.csv` and the active UAE Discount Hub store catalog captured in the store-resolution diagnostic. It does not create, edit, merge, or otherwise modify stores, coupons, imports, mappings, or database data.

The importer must retain exact identity matching. No fuzzy matching, automatic store creation, or automatic consolidation is recommended.

## Store gap list

| Affiliate Store | Coupon Rows | Current Match | Classification | Recommended Public Store | Action |
| --- | ---: | --- | --- | --- | --- |
| H&M UAE | 10 | None | D. NEW STORE | H&M | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Mumzworld UAE | 10 | None | D. NEW STORE | Mumzworld | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Namshi UAE | 8 | None | D. NEW STORE | Namshi | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Bloomingdale's UAE | 8 | None | D. NEW STORE | Bloomingdale's | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Styli Shop UAE | 8 | None | D. NEW STORE | Styli Shop | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Noon UAE | 7 | Noon, after terminal ` UAE` qualifier only | B. SAFE VARIANT | Noon | Add the narrowly deterministic terminal-`UAE` qualifier alias; do not create a second Noon store. |
| VogaCloset UAE | None | D. NEW STORE | VogaCloset | Preserve source spelling; verify UAE affiliate landing page and approve/create catalog store. |
| Amazon UAE | Amazon UAE | A. EXISTING | Amazon UAE | No store action; current exact identity is safe. |
| Ubuy UAE | None | D. NEW STORE | Ubuy | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Kickscrew UAE | None | D. NEW STORE | Kickscrew | Preserve source spelling; verify UAE affiliate landing page and approve/create catalog store. |
| The Entertainer UAE | None | D. NEW STORE | The Entertainer | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Lulu Hypermarket UAE | None | D. NEW STORE | Lulu Hypermarket | Preserve source spelling; verify UAE affiliate landing page and approve/create catalog store. |
| Groupon UAE | None | D. NEW STORE | Groupon | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Mothercare UAE | None | D. NEW STORE | Mothercare | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Crocs UAE | None | D. NEW STORE | Crocs | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Party Centre UAE | None | D. NEW STORE | Party Centre | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Samsung UAE | None | D. NEW STORE | Samsung | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Giordano UAE | None | D. NEW STORE | Giordano | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Sharaf DG UAE | 3 | Sharaf DG, after terminal ` UAE` qualifier only | B. SAFE VARIANT | Sharaf DG | Add the narrowly deterministic terminal-`UAE` qualifier alias; do not create a second Sharaf DG store. |
| SHEIN UAE | None | D. NEW STORE | SHEIN | Preserve source capitalization; verify UAE affiliate landing page and approve/create catalog store. |
| Faces UAE | None | D. NEW STORE | Faces | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Riva Fashion UAE | None | D. NEW STORE | Riva Fashion | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Talabat UAE | None | D. NEW STORE | Talabat | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Farfetch UAE | None | D. NEW STORE | Farfetch | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Nysaa UAE | None | D. NEW STORE | Nysaa | Preserve source spelling; verify UAE affiliate landing page and approve/create catalog store. |
| HomeBox UAE | None | D. NEW STORE | HomeBox | Preserve source spelling; verify UAE affiliate landing page and approve/create catalog store. |
| Nayomi UAE | None | D. NEW STORE | Nayomi | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| The Outnet UAE | None | D. NEW STORE | The Outnet | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Centrepoint UAE | None | D. NEW STORE | Centrepoint | Verify UAE affiliate landing page and approve/create catalog store before re-import. |
| Hotels.com UAE | None | D. NEW STORE | Hotels.com | Verify UAE affiliate landing page and approve/create catalog store before re-import. |

## Classification summary

| Classification | Distinct affiliate stores | Coupon rows | Meaning |
| --- | ---: | ---: | --- |
| A. EXISTING | 1 | 5 | Exact active-store identity exists today. |
| B. SAFE VARIANT | 2 | 10 | A terminal ` UAE` qualifier can be removed, then exactly one active-store identity matches. |
| C. POSSIBLE EXISTING STORE | 0 | 0 | No value has enough evidence to propose a current-store relationship requiring review. |
| D. NEW STORE | 27 | 121 | No active store identity exists; onboarding requires merchant/affiliate approval. |
| E. DO NOT ONBOARD | 0 | 0 | Available CSV/catalog evidence does not establish an unsuitable merchant. |
| F. AMBIGUOUS | 0 | 0 | No source value has more than one candidate under the defined exact rules. |
| **Total** | **30** | **136** |  |

## Duplicate/merchant grouping review

The CSV has one value per merchant label; it contains no pairs such as `Example`, `Example UAE`, and `Example.com UAE` that would warrant a proposed merge.

The two safe variants are not CSV-to-CSV duplicates. They are variants of current catalog labels:

- `Noon UAE` → existing `Noon`
- `Sharaf DG UAE` → existing `Sharaf DG`

They are marked **REQUIRES APPROVAL** only for the deterministic alias-rule product decision. They must not create duplicate stores and must not be handled by a general merchant-merge mechanism.

## Import impact

| Measure | Coupon rows |
| --- | ---: |
| Total CSV rows | 136 |
| Already resolvable under current exact identities | 5 |
| Additional rows resolvable under the safe terminal-`UAE` qualifier rule | 10 |
| Rows associated with existing-but-needing-review stores | 0 |
| Rows associated with proposed new stores | 121 |
| Rows still unresolved until their stores are approved/onboarded | 121 |

The currently observed 4 valid / 1 duplicate result is consistent with the five exact Amazon rows. Applying only the deterministic alias rule would make at most 15 rows store-resolvable before normal row validation and duplicate checks.

## Safest next action

1. Keep exact active-store identity matching as the default.
2. Approve or reject the tightly scoped terminal-`UAE` qualifier alias rule; it affects only `Noon UAE` and `Sharaf DG UAE` in this file and must still require one exact post-normalization match.
3. Review the 27 proposed new stores through the normal Stores-catalog process, including merchant identity, UAE relevance, affiliate destination, and public naming.
4. Add only approved legitimate stores to the catalog; do not auto-create from CSV values.
5. Re-run the unchanged CSV through the importer.
6. Review the resulting store-resolution, validation, and duplicate counts in Preview.
7. Import only after the preview contains the intended stores and row counts.

## Validation

- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.

STORE ONBOARDING PLAN READY
