# Admin Panel UI/UX Fix Plan

## Phase 4 priorities

1. **P1 — remove compact-shell body overflow.** Find and constrain the shared descendants responsible for 492px+ document widths at 375–430px. Preserve any required wide content in an explicitly bounded internal scroller; validate `scrollWidth === clientWidth` at all three mobile sizes.
2. **P1 — make registry tables responsive.** Products and Deals must not expand the document at 1024px or below. Use an internal table-scroll wrapper with an accessible hint, or switch to a compact card/row layout at the breakpoint.
3. **P2 — correct Coupons’ desktop width calculation.** Its layout exceeds even 1440px. Reconcile table min-width, summary-card grid, sidebar width, and page gutters so overflow remains inside the table surface only.
4. **Validation identity.** Add an accessible primary heading to the Write New Post page before re-running the audit; without it, the page cannot satisfy the headline-based evidence rule.
5. **Regression gate.** Re-run the 15 × 9 matrix using the stable no-per-command-restore session pattern and require all 135 VALID states before declaring the audit complete.

## Status

This is a provisional plan based only on the directly confirmed findings in [admin-ui-ux-audit.md](admin-ui-ux-audit.md). Complete the full evidence pass before scheduling page-specific work.

1. **P1 — eliminate shell-level horizontal overflow first.** Identify the element that extends the dashboard to 492px at 390px/430px. Constrain it to the viewport, make any data grid horizontally scroll inside its own wrapper, and verify `documentElement.scrollWidth === clientWidth` on every requested mobile/tablet size.
2. **P2 — unify Admin App Shell responsive geometry.** Establish one set of shell variables for desktop sidebar width, compact header height, main offset, and page gutters. Use them for every admin route instead of route-local layout offsets.
3. **P2 — complete table and fixed-width surface review.** After the shell is fixed, test Products, Deals, Coupons, Stores, Users, Blog, API Sandbox and other data-heavy routes at 430/390/375px. Tables must either become card/list layouts or use an explicit in-container horizontal-scroll treatment; body scrolling is not acceptable.
4. **P2/P3 — normalize page containers.** Compare dashboard, products, editor, form and settings containers at 1920, 1440, 1280 and 1024px. Standardize max widths, left/right gutters, card radius, borders, shadows, button height and vertical rhythm through the shared shell/component primitives.
5. **Regression gate.** For all 14 routes × 9 viewports, archive screenshot + interactive accessibility snapshot + document/main/header/sidebar measurements and reject releases with horizontal body overflow or layout clipping.
