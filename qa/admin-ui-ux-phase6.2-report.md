# Phase 6.2 — Admin App Shell Width Containment

## 1. Exact code change

`components/admin/AdminAppShell.tsx` now gives the shared shell root a definite, shrink-safe inline size:

```tsx
<div className="flex min-h-dvh w-full min-w-0 overflow-x-clip bg-background text-foreground antialiased">
```

The only source-code change in this phase is the addition of `w-full min-w-0` to the existing shell root. No public locale layout, table column definition, breakpoint, API, or business logic was changed.

## 2. Why this fixes the intrinsic-width problem

The public locale layout centers each child with `items-center`. Before this change, the Admin shell was an auto-sized centered flex item, so its width was content-based. A dense table could establish an approximately 900px+ intrinsic shell width before a nested `overflow-x-auto` table region had an available-width boundary.

`w-full` makes `AdminAppShell` occupy its parent’s available width, and `min-w-0` permits shrinking below the min-content size of its descendants. The existing `#admin-main` `min-w-0` and bounded table wrappers then work as intended: a dense table remains wide and scrolls inside its own container, while `html` and `body` remain viewport-wide.

## 3. Verification method

Focused browser QA used the existing persistent authenticated `uae-admin` session and did not supply `--restore` to individual commands. Each route was explicitly opened, allowed to settle, and verified by final route plus its rendered H1 before viewport measurements.

For every row below:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`
- `body.scrollWidth === body.clientWidth`
- table wrapper and table dimensions were inspected
- sidebar/header geometry was inspected

At constrained widths, a wrapper `scrollWidth > clientWidth` is expected and proves overflow belongs to the internal table viewport.

## 4. Products verification matrix

Route and rendered page: `/en/admin/products` — `Products Registry`.

| Viewport | Document SW/CW | Body SW/CW | Table SW/CW | Wrapper SW/CW | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 1024x768 | 1024 / 1024 | 1024 / 1024 | 897 / 897 | 897 / 702 | PASS — internal table scroll |
| 834x1194 | 834 / 834 | 834 / 834 | 897 / 897 | 897 / 784 | PASS — internal table scroll |
| 768x1024 | 768 / 768 | 768 / 768 | 897 / 897 | 897 / 718 | PASS — internal table scroll |
| 430x932 | 430 / 430 | 430 / 430 | 897 / 897 | 897 / 396 | PASS — internal table scroll |
| 390x844 | 390 / 390 | 390 / 390 | 897 / 897 | 897 / 356 | PASS — internal table scroll |
| 375x812 | 375 / 375 | 375 / 375 | 897 / 897 | 897 / 341 | PASS — internal table scroll |
| 1920x1080 | 1920 / 1920 | 1920 / 1920 | 1598 / 1598 | 1598 / 1598 | PASS |
| 1440x900 | 1440 / 1440 | 1440 / 1440 | 1118 / 1118 | 1118 / 1118 | PASS |

At 375px, setting the Products wrapper `scrollLeft` to 120 succeeded while document/body remained `375 / 375`; this verifies horizontal table reachability is internal. Representative artifacts: `qa/products-phase62-375x812.png` and `qa/products-phase62-1920x1080.png`.

## 5. Deals verification matrix

Route and rendered page: `/en/admin/deals` — `Deals Registry`.

| Viewport | Document SW/CW | Body SW/CW | Table SW/CW | Wrapper SW/CW | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 1024x768 | 1024 / 1024 | 1024 / 1024 | 900 / 900 | 900 / 702 | PASS — internal table scroll |
| 834x1194 | 834 / 834 | 834 / 834 | 900 / 900 | 900 / 784 | PASS — internal table scroll |
| 768x1024 | 768 / 768 | 768 / 768 | 900 / 900 | 900 / 718 | PASS — internal table scroll |
| 430x932 | 430 / 430 | 430 / 430 | 900 / 900 | 900 / 396 | PASS — internal table scroll |
| 390x844 | 390 / 390 | 390 / 390 | 900 / 900 | 900 / 356 | PASS — internal table scroll |
| 375x812 | 375 / 375 | 375 / 375 | 900 / 900 | 900 / 341 | PASS — internal table scroll |
| 1920x1080 | 1920 / 1920 | 1920 / 1920 | 1598 / 1598 | 1598 / 1598 | PASS |
| 1440x900 | 1440 / 1440 | 1440 / 1440 | 1118 / 1118 | 1118 / 1118 | PASS |

At 375px, the Deals wrapper accepted `scrollLeft: 120` with `900 / 341` internal scroll dimensions and no document overflow. Representative artifact: `qa/deals-phase62-375x812.png`.

## 6. Coupons verification matrix

Route and rendered page: `/en/admin/coupons` — `Coupons Registry`.

| Viewport | Document SW/CW | Body SW/CW | Table SW/CW | Wrapper SW/CW | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 1024x768 | 1024 / 1024 | 1024 / 1024 | 1140 / 1140 | 1140 / 702 | PASS — internal table scroll |
| 834x1194 | 834 / 834 | 834 / 834 | 1140 / 1140 | 1140 / 784 | PASS — internal table scroll |
| 768x1024 | 768 / 768 | 768 / 768 | 1140 / 1140 | 1140 / 718 | PASS — internal table scroll |
| 430x932 | 430 / 430 | 430 / 430 | 1140 / 1140 | 1140 / 396 | PASS — internal table scroll |
| 390x844 | 390 / 390 | 390 / 390 | 1140 / 1140 | 1140 / 356 | PASS — internal table scroll |
| 375x812 | 375 / 375 | 375 / 375 | 1140 / 1140 | 1140 / 341 | PASS — internal table scroll |
| 1920x1080 | 1920 / 1920 | 1920 / 1920 | 1598 / 1598 | 1598 / 1598 | PASS |
| 1440x900 | 1440 / 1440 | 1440 / 1440 | 1140 / 1140 | 1140 / 1118 | PASS — internal table scroll |

At 375px, the Coupons wrapper accepted `scrollLeft: 120` with `1140 / 341` internal scroll dimensions and no document overflow. Representative artifact: `qa/coupons-phase62-375x812.png`.

## 7. Before/after overflow measurements

The following direct before measurements are from the Phase 6.1 root-cause capture; after values are from this phase’s live browser run.

| Page | Viewport | Before document width / viewport | After document width / viewport |
| --- | --- | ---: | ---: |
| Products | 1024x768 | 1121 / 1024 | 1024 / 1024 |
| Products | 834x1194 | 890 / 834 | 834 / 834 |
| Products | 768x1024 | 857 / 768 | 768 / 768 |
| Products | 430x932 | 680 / 430 | 430 / 430 |
| Products | 390x844 | 660 / 390 | 390 / 390 |
| Products | 375x812 | 653 / 375 | 375 / 375 |
| Deals | 375x812 | 655 / 375 | 375 / 375 |
| Coupons | 375x812 | 774 / 375 | 375 / 375 |

## 8. Sidebar, header, controls, and desktop regression

- At 1024px, all three pages retain the desktop sidebar (`0..256px`) and a correctly bounded header (`256..1024px`).
- At 834px and narrower, the desktop sidebar’s visible width is zero and the header spans the viewport, preserving the existing drawer/mobile behavior.
- At 1920px and 1440px, each shell spans exactly the viewport, with the desktop sidebar retained and headers bounded to the remaining content region.
- Fresh accessibility snapshots confirmed the expected page heading, admin navigation, table headers, and page action controls. At constrained widths the table’s action columns remain reachable through its internal scroll region; no important shell/header controls were clipped.

## 9. Static validation

- `npx tsc --noEmit`: **PASS** (exit code 0).
- `git diff --check`: **PASS** (exit code 0). Git emitted only pre-existing line-ending conversion warnings.

## 10. Remaining issues

No additional overflowing element was found in the focused Products, Deals, or Coupons scenarios. This was deliberately a focused regression pass, not a rerun of the full 135-combination audit.

## Final verdict

**PASS — shared shell containment fixed**
