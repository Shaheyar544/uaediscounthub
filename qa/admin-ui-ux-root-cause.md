# Admin UI/UX Root-Cause Verification

This review used the Phase 4 matrix, screenshots, AX snapshots, targeted live DOM measurements, and the responsible layout/component source. No application code was changed.

# Issue 1

Severity: P1

Page: Systemic across all 15 Admin routes; valid evidence covers 14 routes and Blog New has matching screenshots/measurements but is headline-validation-invalid.

Viewport: 430×932, 390×844, 375×812.

Evidence: Most routes have an exact 492px document width at all three compact widths. Targeted live inspection at 390px found the public-navbar `.nav-right` ending at x=492, plus its Sign In button ending at x=492. The Dashboard screenshot is representative: [dashboard__390x844.png](screenshots/dashboard__390x844.png).

Observed behavior: The whole document is horizontally scrollable at compact widths, even on pages without a wide admin table.

Root cause: This is not the `AdminAppShell`. It is the site-wide public `Navbar` that remains mounted above Admin routes. `components/layout/Navbar.tsx` uses one non-wrapping flex row (`navbar-inner ... flex items-center gap-6`) and a non-shrinking `.nav-right ml-auto flex ...` group containing locale, theme, notification, and Sign In controls. At 390px that group alone reaches 492px. The shell’s `overflow-x-clip` only clips its own flex subtree and cannot constrain the preceding Navbar.

Affected component: `components/layout/Navbar.tsx`, specifically `navbar-inner`, `nav-search`, and `nav-right` compact-breakpoint behavior.

Systemic/Page-specific: SYSTEMIC — shared public layout, not a route-local Admin CSS issue.

Recommended fix: Define an intentional compact Navbar composition in the shared component: allow the center/search portion to shrink or be replaced by a compact trigger, hide/move secondary controls at the compact breakpoint, and ensure the inner flex children have `min-w-0`/bounded widths. The invariant must be that the Navbar’s scroll width never exceeds the viewport.

Regression risk: High because Navbar is site-wide and appears above every Admin route. It requires public and Admin breakpoint regression checks. A page-specific `overflow-x-hidden` rule would merely hide controls and would not correct their layout or keyboard reachability.

# Issue 2

Severity: P1

Page: Products `/en/admin/products`; Deals `/en/admin/deals`.

Viewport: Products: 1024×768, 834×1194, 768×1024, 430×932, 390×844, 375×812. Deals: the same six viewports.

Evidence: Valid Phase 4 measurements show Products at 1121px for a 1024px viewport and 653px for 375px; Deals are 1084px and 615px respectively. The Products AX snapshot contains a seven-column registry table; Deals contains a nine-column registry table with image, product, pricing, coupon, status, and actions.

Observed behavior: These registry surfaces make the document wider at tablet sizes, not only at compact mobile sizes.

Root cause: `components/admin/deals/DealsTableClient.tsx` places `<Table>` directly inside an `overflow-hidden` card — not an internal horizontal-scrolling viewport. `components/admin/products/ProductsTableClient.tsx` does add `overflow-x-auto`, but its table has inline `minWidth: 760`; the surrounding page/container pattern does not consistently establish a `min-w-0` containment boundary at all breakpoints. Consequently the wide intrinsic table size leaks into document width instead of being the scroll width of a dedicated table region.

Affected component: `DealsTableClient`; `ProductsTableClient`; shared table-surface pattern (currently duplicated rather than standardized).

Systemic/Page-specific: PAGE-SPECIFIC in the two registries, with a shared table-pattern architectural cause.

Recommended fix: Introduce/reuse one Admin data-table wrapper whose outer surface is `min-w-0` and whose inner scroll region owns `overflow-x-auto`; give the table its explicit minimum width inside that region. Use the same wrapper in both clients. At a later UX breakpoint, optionally transform the most important fields into compact rows/cards, but do not rely on body scrolling.

Regression risk: Medium. Tables contain selection and row actions; changing their wrapper must retain visible focus, action reachability, and sticky/overflow behavior. A one-off `max-width` on a table would crush columns or clip controls instead of preserving table semantics.

# Issue 3

Severity: P2

Page: Coupons `/en/admin/coupons`.

Viewport: 1440×900, 1280×800, 1024×768, 834×1194, 768×1024, 430×932, 390×844, 375×812.

Evidence: Valid document widths are 1451px at 1440px, 1371px at 1280px, and 774px at 375px. The 1440px screenshot shows an eight-column coupon table. Targeted DOM inspection at 1440px found the Admin shell/main extending to x=1451. The source renders `<Table>` directly inside a card with `overflow-hidden`.

Observed behavior: Coupons overflows even on wide desktop, so the issue is independent of the compact Navbar failure.

Root cause: `app/[locale]/admin/coupons/page.tsx` renders an eight-column intrinsic-width `<Table>` (including Store, Title, Discount, Clicks, Expires, Status, and Actions) inside `rounded-xl ... overflow-hidden`. `overflow-hidden` clips visual pixels but is not an internal scroll strategy; it leaves the table’s intrinsic width participating in the layout. The Admin shell’s `min-w-0` main correctly allows shrinkage, so the table/card is the source of the extra document width.

Affected component: Coupon registry table in `app/[locale]/admin/coupons/page.tsx`.

Systemic/Page-specific: PAGE-SPECIFIC, though it should adopt the same shared Admin data-table wrapper as Issue 2.

Recommended fix: Replace the card’s direct table placement with the shared bounded data-table scroll region, preserving card border/radius on the outer wrapper and putting `overflow-x-auto` on the inner viewport. This is the smallest architectural correction because it removes a desktop overflow without changing grid/sidebar geometry.

Regression risk: Medium. Coupon verification/enable/delete actions must remain discoverable after horizontal scrolling; use an accessible scroll affordance rather than hidden clipping.

# Blog New Validation

Route: `/en/admin/blog/new`

Why headline verification failed: The page component `app/[locale]/admin/blog/new/page.tsx` renders only `<PostEditor ... />`. `components/admin/blog/PostEditor.tsx` begins as an editor workspace and uses a title `<textarea>` placeholder, but exposes no page-level `h1`. All nine URL/screenshot/AX/measurement artifacts exist; the strict verifier correctly marked them invalid because no semantic page heading was available.

Is missing H1 actually a UX/accessibility issue?: **Yes.** This is an editor/workspace, but that does not exempt it from having an accessible primary page name. A blank post-title field is document content, not reliable navigation context. Screen-reader users and heading navigation need a stable page-level name such as “Write New Post.”

Recommended action: Add one visually appropriate semantic `h1` for the editor workspace (it may be visually compact or screen-reader-only if the intended design needs no large title). Keep the editable post title separate. The validation rule is appropriate; the missing heading should be fixed rather than waived.

# Prioritized implementation order

1. Highest-impact systemic fix — make the shared `Navbar` genuinely responsive on compact widths; it causes the 492px body overflow across the application.
2. Highest-impact page-specific fix — establish a shared bounded data-table wrapper and apply it to Products and Deals, eliminating tablet body overflow while preserving table semantics.
3. Remaining page-specific fix — apply the same wrapper to Coupons, which overflows at 1440px because its table is currently uncontained.
4. Blog/New validation decision — add the semantic workspace `h1`; do not weaken the evidence rule.
