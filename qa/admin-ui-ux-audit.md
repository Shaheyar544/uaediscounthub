# Admin Panel UI/UX Audit

## Phase 4 validated result — incomplete

The stable single-session run captured all 135 requested route × viewport artifacts. **126 combinations are VALID; 9 are INVALID**, so this audit is not complete under the requested acceptance rule. The only invalid route is `/en/admin/blog/new` at all nine viewports: it renders and has a correct URL, screenshot, AX snapshot, and measurements, but it exposes no `h1`, preventing the required headline-based identity validation.

See [the full evidence matrix](admin-ui-ux-evidence.md). No application code was changed.

## Confirmed issues

### ISSUE-001 — Body-level horizontal overflow across most mobile admin pages

| Field | Evidence |
| --- | --- |
| Severity | P1 |
| Page / Route | Systemic: Dashboard, Products, Deals, Coupons, Stores, Categories, Newsletter, Pages, Blog, Blog New, Ad Widgets, Settings, API Sandbox, and Profile |
| Viewport | 430×932, 390×844, 375×812 |
| Problem | `documentElement.scrollWidth` exceeds viewport width, producing body-level horizontal scrolling rather than a constrained page or internal scroll surface. Representative measurements: Dashboard 492px at 390px/375px; Coupons 774px at 375px. |
| Evidence | Valid entries and per-viewport screenshots/AX snapshots in the evidence matrix; e.g. `qa/screenshots/dashboard__390x844.png`, `qa/screenshots/coupons__375x812.png`. |
| Likely root cause | Shared shell/content descendants retain desktop or table minimum widths at the compact breakpoint. |
| Affected component | Shared Admin App Shell plus page-level data/table surfaces. |
| Scope | SYSTEMIC |

### ISSUE-002 — Products and Deals allow their wide registry surfaces to expand the document at tablet and mobile widths

| Field | Evidence |
| --- | --- |
| Severity | P1 |
| Page / Route | Products `/en/admin/products`; Deals `/en/admin/deals` |
| Viewport | Products: 1024×768 through 375×812. Deals: 1024×768 through 375×812. |
| Problem | Registry/table layouts cause body-level overflow at tablet widths where a desktop sidebar is still active, as well as on mobile. |
| Evidence | Valid document-width checks in the matrix; the Products AX snapshot identifies a seven-column registry table. |
| Likely root cause | Tables/fixed-width columns are not enclosed in a dedicated horizontal-scroll region or replaced with a responsive row/card representation. |
| Affected component | Products and Deals registry tables. |
| Scope | PAGE-SPECIFIC implementation with a shared table-pattern impact |

### ISSUE-003 — Coupons document is too wide before the compact breakpoint

| Field | Evidence |
| --- | --- |
| Severity | P2 |
| Page / Route | Coupons `/en/admin/coupons` |
| Viewport | 1440×900, 1280×800, 1024×768, 834×1194, 768×1024, and all mobile sizes |
| Problem | The coupons registry makes the document wider than the viewport even at 1440px, despite the visual table appearing almost contained. |
| Evidence | Valid measured overflow entries in the matrix and `qa/screenshots/coupons__1440x900.png`. |
| Likely root cause | A minimum-width table/summary grid plus sidebar/gutter math exceeds the available main-content width. |
| Affected component | Coupons registry page. |
| Scope | PAGE-SPECIFIC |

## Counts

- P0: 0
- P1: 2
- P2: 1
- P3: 0
- Systemic issues: 1
- Page-specific issues: 2

## Audit status — incomplete / not sign-off ready

This is deliberately **not** presented as the requested completed audit. The initial direct pass used the authenticated `uae-admin` session and verified the live navigation routes. A later automated capture queue could not preserve an atomic page/viewport pairing in that single browser session; it wrote some screenshots while queued navigation commands were still being processed. Those artifacts are therefore retained for troubleshooting only and are not relied on as issue evidence.

Completed, directly measured shell observations:

| Page | Viewports directly measured | Result |
| --- | --- | --- |
| `/en/admin` | 1920×1080, 1440×900, 1280×800, 1024×768, 834×1194, 768×1024, 430×932, 390×844 | Desktop/tablet had no document-level overflow. At 430px and 390px, document/body width was 492px, exceeding the viewport. |
| `/en/admin/products` | Initial rendered states at 1920×1080, 1440×900, 1280×800 | Captured but not yet individually measured/validated. |
| Remaining requested routes | Navigation routes discovered only | Not yet validly inspected at every requested viewport. |

Live navigation route corrections discovered from the Admin navigation:

- Newsletter: `/en/admin/newsletters`
- Blog Posts: `/en/admin/blog`
- Ad Widgets: `/en/admin/blog/ad-widgets`

## Confirmed findings

### ISSUE-001 — Mobile body-level horizontal overflow in the Admin shell

| Field | Evidence |
| --- | --- |
| Page | `/en/admin` |
| Viewport | 430×932 and 390×844 |
| Severity | P1 — major UX/layout problem |
| Problem | The rendered document is 492px wide on 430px and 390px viewports. This creates body-level horizontal scrolling and makes content at the viewport edges inaccessible or clipped. |
| Evidence | Direct geometry capture: `scrollWidth/clientWidth = 492/430` and `492/390`; the 390px state also showed the responsive bottom navigation while the main page retained a wider layout. |
| Likely root cause | A shell descendant retains a desktop minimum/fixed width or an unbounded horizontal content surface rather than being constrained by `max-width: 100%` / responsive grid rules. |
| Affected component | Shared Admin App Shell and/or its dashboard content container. |
| Scope | Systemic candidate; it must be revalidated independently on every admin route. |

### ISSUE-002 — Shared shell alignment changes sharply at the desktop/tablet breakpoint

| Field | Evidence |
| --- | --- |
| Page | `/en/admin` |
| Viewport | 1024×768 vs. 834×1194 |
| Severity | P2 — noticeable UI problem |
| Problem | At 1024px the admin sidebar is a 231px column starting at x=12 and the content starts at x=256. At 834px the sidebar has zero rendered size and the admin content abruptly expands from x=0. The breakpoint is functionally responsive, but the shell changes its header/content relationship rather than maintaining a visibly coherent transition. |
| Evidence | Direct bounding boxes: 1024px admin nav `[12,192,231,824]`, admin main `[256,104,768,…]`; 834px admin nav `[0,0,0,0]`, main `[0,104,834,…]`. |
| Likely root cause | Separate desktop and compact shell layouts with independently defined offsets/gutters. |
| Affected component | Shared Admin App Shell. |
| Scope | Systemic candidate. |

## Console / accessibility status

The direct dashboard pass exposed development-only React DevTools/HMR messages, not a confirmed production console error. A full route-by-route console and accessibility result is outstanding; no accessibility conformance claim is made here.

## Required completion work

Run the requested 14 routes × 9 viewports again with one isolated, sequential browser interaction per captured state; for each state retain a screenshot, interactive accessibility snapshot, bounding-box/width record, and console check before moving on. Do not use the queued files under `qa/admin-ui-ux-evidence/` as final proof.

## Phase 2 validation blocker

Phase 2 could not start a valid evidence matrix with the required restored browser session. The precise live failure is documented in [admin-ui-ux-evidence.md](admin-ui-ux-evidence.md): the browser reported `/en/admin` while rendering the Settings page, and later moved from Settings to API Sandbox between read-only commands without a requested navigation. Consequently, Phase 2 contributed **zero valid page × viewport combinations** and did not confirm or alter any issue severity.
