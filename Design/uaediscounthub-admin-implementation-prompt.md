# UAE Discount Hub — State-of-the-Art Admin Redesign Implementation Prompt

## Objective

Completely redesign the existing UAE Discount Hub admin panel into a premium, production-grade affiliate/deals operations dashboard.

The current panel is functional but visually under-utilizes the desktop viewport, has excessive empty space, weak information hierarchy, placeholder analytics, and a generic admin-template appearance. The new design must feel like a serious affiliate intelligence / commerce operations platform rather than a basic CRUD panel.

Public site context: UAE Discount Hub is an AI-powered UAE/GCC deals and price-comparison platform. The public website currently emphasizes real-time price comparison, stores such as Amazon UAE, Noon and Sharaf DG, deal discovery, coupon codes, price-drop alerts, and affiliate-style outbound activity.

## Design direction

Use a **premium SaaS + commerce intelligence** visual language:

- Desktop-first, correctly proportioned 1440px/1600px layouts.
- Fixed left sidebar around 240–260px.
- Main content should use the remaining viewport instead of being constrained to a narrow central column.
- 68px-ish sticky top bar.
- 24–32px content padding.
- 12–16px card radius.
- Subtle borders and shadows; avoid heavy gradients.
- Strong typography hierarchy.
- Blue as the primary action color, with green for positive performance, amber for warnings, red for failures, and purple for secondary analytics.
- Support light and dark themes.
- Do not copy the attached screenshot literally; use it only as the starting information architecture.
- Eliminate the public website footer from the authenticated admin application.
- Avoid huge blank areas.
- Use responsive breakpoints and a mobile drawer sidebar.

## New information architecture

### Workspace
1. Overview
2. Products
3. Deals
4. Coupons
5. Stores
6. Categories
7. Affiliate Networks
8. Price Tracking
9. Price Alerts
10. Newsletter
11. Users

### Content
12. Pages
13. Blog Posts
14. Media Library
15. Ad Widgets
16. SEO / Metadata

### Analytics
17. Affiliate Analytics
18. Revenue
19. Clicks & Conversions
20. Coupon Analytics
21. Store Performance

### System
22. Feed / API Sync
23. API Sandbox
24. Moderation Queue
25. Settings
26. Audit Logs
27. My Profile

Use collapsible navigation groups so the sidebar does not become visually overwhelming.

## Dashboard overview

Replace the current four simple cards with a high-value executive dashboard.

Primary KPI cards:

- Affiliate Revenue
- Affiliate Clicks
- Conversions
- Conversion Rate
- EPC
- Active Deals
- Active Coupons
- Registered Users

Each KPI should support:
- Current value
- Percentage change
- Comparison period
- Mini sparkline
- Tooltip
- Drill-down action

Example:
Affiliate Revenue → AED 18,426 → +14.8% → vs previous 30 days.

Do NOT hardcode fake values in production. The HTML prototype may use mock data only.

## Main analytics

Create a large Revenue & Affiliate Performance chart.

Requirements:
- Revenue line/area
- Clicks secondary axis
- Date range selector
- 7 / 30 / 90 days
- Custom range
- Tooltip
- Legend
- Loading skeleton
- Empty state
- Error state

Additional charts:
- Revenue by store
- Clicks by store
- Conversion funnel
- Coupon usage
- Category performance
- Top products
- Price-drop activity

## Affiliate-specific functionality

The dashboard must be designed around an affiliate business model.

Track:

- Outbound clicks
- Affiliate clicks
- Conversion events
- Orders
- Commission
- EPC
- Conversion rate
- Revenue by merchant
- Revenue by product
- Revenue by category
- Revenue by campaign
- Coupon redemptions
- Failed affiliate tracking events
- Missing tracking parameters
- Broken affiliate links

Add an Affiliate Network section where each network can have:
- Network name
- Merchant
- Tracking ID
- Status
- Commission model
- Cookie duration
- Last sync
- API status
- Clicks
- Conversions
- Revenue

## Deals management

Create a professional data table with:

- Product image
- Product name
- Store
- Category
- Current price
- Previous price
- Discount %
- Affiliate URL
- Clicks
- Conversions
- Revenue
- Deal score
- Status
- Last verified
- Actions

Table features:
- Search
- Column visibility
- Sort
- Filters
- Pagination
- Bulk selection
- Bulk publish
- Bulk archive
- Bulk sync
- CSV export
- Row actions
- Keyboard-friendly navigation

## Coupon management

Coupon fields:

- Code
- Merchant
- Discount
- Type
- Minimum order
- Start date
- Expiry date
- Verification status
- Uses
- Clicks
- Conversion rate
- Revenue
- Last checked

Statuses:
- Verified
- Expiring Soon
- Expired
- Failed Verification
- Pending Review

Add a verification queue.

## Store management

Store dashboard should show:

- Store logo
- Store name
- Active deals
- Active coupons
- Clicks
- Orders
- Revenue
- Conversion rate
- Last feed sync
- API status
- Affiliate status

Include store detail pages with historical performance.

## Product management

Support:
- Product creation
- Product editing
- Bulk import
- Feed import
- Product matching
- Duplicate detection
- Price history
- Lowest price in 30/60/90 days
- Price-drop detection
- Affiliate URL validation
- SEO metadata
- Product images
- Category mapping
- Merchant mapping

## Price intelligence

Add a dedicated Price Tracking module.

For each product show:
- Current price
- Previous price
- Historical lowest
- Historical highest
- 30-day average
- Price trend chart
- Price-drop percentage
- Last checked
- Merchant comparison

Add automatic price-drop alerts.

## System health

Create a prominent system-health area:

- Overall sync health
- Amazon feed
- Noon feed
- Sharaf DG feed
- Carrefour feed
- Jarir feed
- Affiliate API health
- Broken-link rate
- Failed jobs
- Queue depth
- Last successful sync

Use green / amber / red states.

## Activity and moderation

Create:
- Recent admin activity
- Deal review queue
- Coupon verification queue
- Broken affiliate links
- Failed product imports
- Duplicate products
- SEO issues

Every item should be actionable.

## Header

Top bar should include:

- Global search
- Command palette (Cmd/Ctrl + K)
- Notifications
- Quick add
- Theme switcher
- Language switcher: English / العربية
- Admin profile
- Environment indicator if applicable

## Arabic / RTL

Because this is a UAE/GCC platform, build RTL readiness from day one.

Requirements:
- `dir="rtl"` support
- Arabic translations
- RTL sidebar behavior
- RTL charts/table alignment where appropriate
- Arabic-friendly font stack
- No hardcoded left/right positioning where logical properties can be used

Use CSS logical properties:
- margin-inline
- padding-inline
- inset-inline
- border-inline

## UI components

Use reusable components rather than page-specific markup:

- AppShell
- Sidebar
- Topbar
- Breadcrumbs
- KPI Card
- Sparkline
- Chart Card
- DataTable
- FilterBar
- SearchInput
- DateRangePicker
- StatusBadge
- EmptyState
- ErrorState
- LoadingSkeleton
- ConfirmDialog
- Drawer
- Sheet
- CommandPalette
- Toast
- Modal
- Dropdown
- Tabs
- Pagination

## Accessibility

Target WCAG 2.2 AA.

Requirements:
- Keyboard navigation
- Visible focus states
- ARIA labels
- Proper semantic HTML
- Color should never be the only status indicator
- Sufficient contrast
- Screen-reader-friendly tables
- Reduced-motion support

## Performance

- Lazy-load charts
- Virtualize very large tables
- Server-side pagination for large datasets
- Debounce search
- Cache API queries
- Avoid unnecessary re-renders
- Use skeleton states
- Optimize product thumbnails
- Do not load huge icon libraries unnecessarily

## Recommended stack

Preferred production stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- TanStack Table
- TanStack Query
- Recharts
- Zod
- React Hook Form / TanStack Form
- Zustand where global client state is genuinely required
- Lucide icons
- next-themes
- Sonner for notifications

If the existing application is already React/Vite and migration would be disruptive, keep the existing framework and adopt the same component architecture instead of rewriting the entire backend.

## Supabase / backend

If Supabase is the existing backend, preserve the current database and API contracts unless a migration is explicitly approved.

Use:
- Supabase Auth
- Supabase Postgres
- Row Level Security
- Supabase Storage where appropriate
- Server-side API routes/actions for sensitive operations

Never expose:
- Service-role keys
- Affiliate secrets
- Merchant API secrets
- Private tokens

## Suggested open-source repositories

Use these as references/foundations rather than copying their UI.

### 1. Kiranism/next-shadcn-dashboard-starter
Recommended primary reference for a production-grade Next.js admin foundation.

GitHub:
https://github.com/Kiranism/next-shadcn-dashboard-starter

It includes Next.js 16, React, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Table, TanStack Query, Recharts, forms, RBAC patterns, themes, and AI-agent-oriented project instructions.

### 2. ropean/shadcn-admin-template
Good reference for routing, TanStack Router, Query, Table, Zustand, forms, RTL/LTR and a modern admin architecture.

GitHub:
https://github.com/ropean/shadcn-admin-template

### 3. Gazi2050/shadcn-dashboard
Useful for reusable admin pages, tables, charts, forms, authentication layouts and dark/light mode.

GitHub:
https://github.com/Gazi2050/shadcn-dashboard

### 4. shadcn/ui
Use this for the component primitives and design system rather than building every component manually.

https://ui.shadcn.com/

## Important implementation rule

Do not blindly install a dashboard template and replace the current application.

First:
1. Inspect the current repository.
2. Identify framework and build system.
3. Identify current authentication.
4. Identify database schema.
5. Identify Supabase integration.
6. Identify existing routes.
7. Identify affiliate tracking logic.
8. Identify existing product/deal/coupon APIs.
9. Preserve working business logic.
10. Replace the presentation layer incrementally.

## Recommended implementation phases

### Phase 1 — Design system
- App shell
- Sidebar
- Topbar
- Theme
- Typography
- Colors
- Buttons
- Cards
- Tables
- Badges
- Forms

### Phase 2 — Dashboard
- KPI cards
- Revenue chart
- Click/conversion analytics
- Store performance
- System health
- Activity
- Quick actions

### Phase 3 — Data operations
- Products
- Deals
- Coupons
- Stores
- Categories

### Phase 4 — Affiliate intelligence
- Networks
- Click tracking
- Conversions
- Revenue
- EPC
- Commission
- Broken links

### Phase 5 — Price intelligence
- Price history
- Price drops
- Merchant comparison
- Alerts

### Phase 6 — Content / SEO
- Blog
- Pages
- Media
- SEO
- Ad widgets

### Phase 7 — Reliability
- Audit log
- Sync monitoring
- Job queue
- API health
- Error handling

### Phase 8 — QA
Test:
- Desktop 1440×900
- Desktop 1920×1080
- Laptop 1366×768
- Tablet
- Mobile
- RTL
- Dark mode
- Keyboard navigation
- Slow API
- Empty data
- API failure
- Large tables

## Visual acceptance criteria

The final dashboard should:

- Fill the desktop viewport naturally.
- Have a balanced 240–260px sidebar.
- Have a 68px topbar.
- Use a 12-column responsive grid.
- Avoid the large empty central area visible in the old design.
- Make the most important metrics visible without scrolling.
- Put analytics above operational tables.
- Make actions obvious.
- Look premium but not flashy.
- Feel consistent across every admin page.
- Work equally well in English and Arabic.
- Be usable with real affiliate data, not just demo cards.

## Final developer instruction

Build the redesign as a real application, not a static screenshot.

Every interactive element must either:
1. work against the existing API/data layer, or
2. have a clearly isolated mock-data adapter during development.

Do not delete existing business functionality just to achieve the new visual design.

Before merging:
- run type checking
- run linting
- run tests
- run production build
- check responsive layouts
- verify authentication
- verify RLS/security
- verify affiliate URLs
- verify analytics events
- verify no secrets are exposed in client bundles
