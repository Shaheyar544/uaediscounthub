# Products Mobile/Tablet Overflow Root-Cause Investigation

Scope: read-only investigation of `/en/admin/products` in the persistent authenticated `uae-admin` browser session. No application code was changed. Each measurement was taken after navigation/render settle and a horizontal scroll-position reset.

## 1. Reproduction matrix

| Viewport | Document scrollWidth / clientWidth | Body scrollWidth / clientWidth | Body overflow | Screenshot |
| --- | ---: | ---: | --- | --- |
| 1024x768 | 1121 / 1024 | 1121 / 1024 | Yes (+97px) | `qa/products-overflow-1024x768.png` |
| 834x1194 | 890 / 834 | 890 / 834 | Yes (+56px) | `qa/products-overflow-834x1194.png` |
| 768x1024 | 857 / 768 | 857 / 768 | Yes (+89px) | `qa/products-overflow-768x1024.png` |
| 430x932 | 680 / 430 | 680 / 430 | Yes (+250px) | `qa/products-overflow-430x932.png` |
| 390x844 | 660 / 390 | 660 / 390 | Yes (+270px) | `qa/products-overflow-390x844.png` |
| 375x812 | 653 / 375 | 653 / 375 | Yes (+278px) | `qa/products-overflow-375x812.png` |

All six requested viewports reproduce the defect. The URL remained `http://localhost:3000/en/admin/products` and the live page heading was `Products Registry`.

## 2. Exact overflowing elements

At 375px (representative compact result), the following nested elements all exceed the viewport because they have been laid out in an already-expanded ancestor:

| Element | Bounding rect (left, right, width) | scrollWidth / clientWidth |
| --- | ---: | ---: |
| Admin shell root | -278, 653, 931 | 931 / 931 |
| `#admin-main` | -278, 653, 931 | 931 / 931 |
| Admin content container (`mx-auto ... max-w-[1600px]`) | -262, 637, 899 | 899 / 899 |
| Products table scroll wrapper | -262, 637, 899 | 897 / 897 |
| Products `<table>` | -261, 636, 897 | 897 / 897 |

The equivalent tablet evidence is consistent: at 1024px the shell is 1,219px wide (left -97, right 1121), the wrapper is 899px wide (left 191, right 1089), and the table is 897px wide (left 192, right 1088).

The table is therefore a contributing intrinsic-width source, but it is **not** overflowing from a correctly bounded internal scrolling region. Its wrapper has expanded to table width, so it has no smaller viewport in which to scroll.

## 3. DOM/component path

```text
app/[locale]/layout.tsx
  <main class="... flex-col items-center ...">       // centered flex child context
    components/admin/AdminAppShell.tsx
      <div class="flex min-h-dvh overflow-x-clip ..."> // shell root, no `w-full`
        <main id="admin-main" class="min-w-0 flex-1">
          content container: "mx-auto w-full min-w-0 max-w-[1600px]"
            app/[locale]/admin/products/page.tsx
              components/admin/products/ProductsTableClient.tsx
                <div class="min-w-0 max-w-full overflow-x-auto">
                  <table style="width: 100%; min-width: 760px">
```

Source locations verified:

- `app/[locale]/layout.tsx:135` centers all page children with `items-center`.
- `components/admin/AdminAppShell.tsx:12` defines the shell root without an explicit full-width constraint; `:14` correctly gives the inner main `min-w-0`.
- `components/admin/products/ProductsTableClient.tsx:144-145` defines the Products scrolling wrapper and the table's `minWidth: 760`.
- `components/ui/table.tsx:10-11` uses the same `min-w-0 max-w-full overflow-x-auto` contract for shared `<Table>` surfaces.

## 4. Computed-style evidence

The representative 375px live styles were:

| Element | Computed width | min-width | max-width | overflow-x | Relevant observation |
| --- | ---: | --- | --- | --- | --- |
| Shell root | 930.875px | auto | none | clip | It is a flex item centered by the public layout, so auto sizing follows its intrinsic content width. `clip` does not establish a narrower layout width. |
| `#admin-main` | 930.875px | 0px | none | visible | `min-w-0` is present, but it cannot constrain an ancestor whose own used width is already 931px. |
| Content container | 898.875px | 0px | 1600px | visible | It fills the shell's intrinsic main width, rather than the 375px viewport. |
| Products scroll wrapper | 898.875px | 0px | 100% | auto | It has correct scrolling intent, but `100%` resolves against an 899px containing block. |
| Products table | 896.875px | 760px | none | visible | Dense seven-column table resolves to 897px from content/column widths. |

No absolute positioning, transforms, `white-space: nowrap`, or toolbar/header action exceeded the viewport independently. The header controls observed outside the viewport are descendants of the same expanded shell, not a separate cause.

## 5. Root cause

The public locale layout makes every page child a centered flex item (`items-center`). `AdminAppShell` is that child and has no `w-full` (or equivalent definite inline size). A centered flex item with auto width uses its content-based size. The dense Products table consequently gives the shell an approximately 931px intrinsic width on compact viewports (and 1,219px at 1024px when the sidebar participates).

Once the shell is wider than the viewport, the Phase 6 table wrapper's `max-w-full overflow-x-auto` is bounded by the expanded shell, not by the browser viewport. The wrapper thus becomes 899px wide alongside its 897px table, leaving no internal horizontal-scroll delta and exporting overflow to `body`/`html`.

This is a **shared Admin shell containment defect exposed by Products' wide table**, not a Products toolbar, filter, pagination, card, or fixed-position defect.

## 6. Why the Phase 6 table containment did not solve it

Phase 6 correctly added `min-w-0`, `max-w-full`, and `overflow-x-auto` at the table surface. Those rules require a parent with a definite bounded width. Here `max-width: 100%` is relative to the intrinsic 899px content container, because the outer Admin shell shrink-wraps within the centered public flex layout.

The table wrapper is therefore internally scrollable in principle (`overflow-x: auto`), but its `clientWidth` equals its `scrollWidth` (897px) in the failing states. There is nothing left for that wrapper to scroll; the document receives the overflow instead.

## 7. Comparison with Deals and Coupons

At 375px, after serial navigation with fresh rendered content/snapshots:

| Page | Document width / viewport | Shell width | Table wrapper width | Table width | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Products | 653 / 375 | 931 | 899 | 897 | Body overflows |
| Deals | 655 / 375 | 934 | 900 | 900 | Body overflows |
| Coupons | 774 / 375 | 1,174 | 1,140 | 1,140 | Body overflows |

Deals and Coupons use the shared table wrapper (`relative min-w-0 max-w-full overflow-x-auto`) and show the same containment failure. The varying final document widths are explained by each table's intrinsic width, not by separate route-level layout bugs.

## 8. Recommended minimal fix

Give the shared `AdminAppShell` root a definite, shrink-safe width as the direct child of the public centered flex layout: `w-full min-w-0` (while retaining its existing `overflow-x-clip`). This makes the shell's available inline size equal to the viewport/public-main width. The existing inner `#admin-main` `min-w-0` and table wrappers can then do their intended jobs: their wrappers become viewport-bounded and their dense tables retain readable minimum widths as **internal** horizontal scroll content.

As a small follow-through to keep the table contract explicit, retain/use `w-full min-w-0 max-w-full overflow-x-auto` on the Products wrapper and the shared `Table` wrapper. That is not a page-specific workaround; it documents that the scroll viewport fills the now-bounded parent. It should not be implemented as `body { overflow-x: hidden }`, negative margins, reduced table min-widths, or route-specific clipping, as each would mask or damage dense-table usability.

## 9. Fix classification and regression risks

- **Fix type:** shared component-level fix.
- **Fix location:** `components/admin/AdminAppShell.tsx` (the immediate Admin flex item under the public layout). The shared table-wrapper contract remains the complementary pattern, not the primary source of the failure.
- **Why not Products-specific:** identical live mechanics occur in Deals and Coupons. Products-only CSS would leave the common shell dependent on each page's intrinsic content and would reintroduce the defect on future dense pages.
- **Regression risks:** desktop shell width and sidebar composition; tablet breakpoint behavior; every Admin page inherited from this shell; table focus/scroll reachability. Validate at least Products, Deals, Coupons, a non-table Admin page, and desktop/tablet/mobile widths after implementation. Preserve tables' current readable minimum widths and confirm `documentElement.scrollWidth === clientWidth` while each table wrapper has `scrollWidth > clientWidth` when narrow.

## Verdict

**ROOT CAUSE:** `AdminAppShell` is an auto-width, centered flex child of the public locale layout; dense table intrinsic widths expand the shell before the table's internal scroll boundary can constrain them.

**FIX LOCATION:** `components/admin/AdminAppShell.tsx` shell root, with the shared table-wrapper width contract kept explicit.

**FIX TYPE:** Shared component-level fix.

**CONFIDENCE:** HIGH.
