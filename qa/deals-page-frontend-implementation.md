# Deals Page Frontend Implementation

## Files changed

- `app/[locale]/deals/page.tsx`
- `app/[locale]/deals/loading.tsx`
- `app/[locale]/deals/error.tsx`
- `components/deals/DealsCatalog.tsx`

## Existing functionality reused

- The existing locale-aware public route: `/{locale}/deals`.
- The existing public Supabase client and `deals -> products -> stores` relationships.
- Existing product detail routes for records with a product slug.
- Existing affiliate destinations for records with an affiliate URL.
- Existing public navbar and page shell, whose Deals navigation item is already active.

## Real data sources

The page reads active deals from `public.deals`, joins product image/title/category data and store identity/logo data, excludes expired records, and excludes scheduled records whose start time is still in the future. The result set is deliberately bounded to 120 live records.

Displayed prices, original prices, savings, discount percentages, retailers, expiry text, hero counts, categories, and retailer options are all derived from fetched deal data. Savings are only shown when `original_price > current_price`; no missing price is invented.

## Search and filters

- Search filters the bounded, live deal data by deal title, retailer, and category.
- Category and retailer filters are derived only from the fetched real dataset.
- Price ranges are based on the current deal price.
- Sorting supports Recommended, Biggest Saving, Newest, and Ending Soon.

## Responsive behavior

- Desktop: three-column grid at `xl` widths.
- Tablet: two-column grid at `md` widths.
- Mobile: one-column grid, horizontally scrollable category chips, and stacked filter controls.
- Cards use `min-w-0`, bounded media, and responsive container padding to prevent page-level horizontal overflow.

## Compact marketplace grid update

- The deal grid is now compact and product-first: two columns on mobile and tablet, three at 1024px, four at 1440px, and five at 1920px.
- Cards use fixed compact media heights (124px mobile, 144px tablet, 160px at 1024px, and 180px at desktop), a reduced card body, two-line titles, concise price/saving rows, and a compact 32px-high `SHOP DEAL` CTA.
- Missing or zero current prices are no longer converted to `AED 0.00`. They display `Price unavailable`; missing retailers display `Retailer unavailable`; missing images retain a small bounded fallback.
- Focused browser verification confirmed the rendered column count and no document overflow: 1920/5, 1440/4, 1024/3, 768/2, 430/2, 390/2, 375/2. Evidence screenshots are stored in `qa/screenshots/deals-compact-grid__1440x900.png` and `qa/screenshots/deals-compact-grid__390x844.png`.

## States

- Route-level loading skeleton: `loading.tsx`.
- Route-level retry error state: `error.tsx`.
- Data query error state, no-live-deals state, and no-filter-results state in the catalog.

## Validation

- `npx tsc --noEmit`: passed.
- `git diff --check`: passed.
- Local `GET /en/deals`: rendered the new page using the real live dataset without the prior database-column error.
- Targeted ESLint could not start because the existing `eslint.config.mjs` imports `eslint-config-next/core-web-vitals.js`, which is not exported by the installed package version. This is a project tooling mismatch, not a lint finding from these files.

## Limitations

- The current live dataset returned one active deal during local verification and no embedded retailer/category on that record. The UI deliberately uses its graceful fallbacks rather than inventing values.
- There is no `price_checked_at` field in the existing deal model, so the optional “Price checked recently” claim was intentionally not displayed.
- No database schema or backend behavior was changed.
