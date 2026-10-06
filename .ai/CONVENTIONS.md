---
area: coding-conventions
importance: high
last-reviewed: 2026-09-24
source-of-truth:
  - tsconfig.json
  - eslint.config.mjs
  - app/
  - components/
---

# Codebase Conventions & Best Practices

## 1. Naming & File Organization

| Category | Convention | Example |
| :--- | :--- | :--- |
| **React Components** | `PascalCase.tsx` | `DealCard.tsx`, `CouponImportWizard.tsx` |
| **Pages & Routes** | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` | `app/[locale]/deals/page.tsx` |
| **Server Actions** | `actions.ts` or `*-actions.ts` co-located with routes | `app/[locale]/admin/products/actions.ts` |
| **Route Handlers (API)**| `route.ts` inside `app/api/...` | `app/api/admin/cron/update-prices/route.ts` |
| **Utility & Service Files** | `kebab-case.ts` | `lib/amazon-creators-api.ts`, `utils/auth/require-admin.ts` |
| **TypeScript Types** | `types/*.ts` | `types/blog.ts`, `types/profile.ts` |
| **Hooks** | `use-*.ts` inside `hooks/` | `hooks/use-compare.ts`, `hooks/use-has-mounted.ts` |

---

## 2. React & Next.js Patterns
* **Server Components First**: Every page is a React Server Component by default to maximize SSR performance and SEO.
* **Client Components (`"use client"`)**: Isolated to components requiring user events, hooks (`useState`, `useEffect`), or browser APIs (`localStorage`, `framer-motion`).
* **Server Actions**: Must begin with `"use server"`. Use for form submissions and admin mutations.
* **Async Params**: In Next.js 15/16, route parameters (`params` and `searchParams`) are asynchronous:
  ```typescript
  export default async function Page({
    params,
    searchParams
  }: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
  }) {
    const { locale, slug } = await params;
    const { query } = await searchParams;
  }
  ```

---

## 3. Data Fetching & Mutation Patterns
* **Reading Public Data**: Use `createClient()` from `utils/supabase/server.ts` directly inside Server Components.
* **Admin Mutations**: Use `createAdminClient()` from `utils/supabase/admin.ts` inside protected Server Actions or Route Handlers.
* **Cache Invalidation**: Call `revalidatePath('/[locale]/...', 'page' | 'layout')` after mutations to refresh server-rendered pages.

---

## 4. UI & Styling Patterns
* **Tailwind CSS v4**: Use utility classes with CSS variables (`bg-primary`, `text-foreground`, `border-border`, `bg-card`).
* **Class Merging**: Combine conditional classes using `cn(...)` from `lib/utils.ts` (`clsx` + `tailwind-merge`).
* **Icons**: Import icons from `lucide-react`.
* **Standard HTML Images for Grid Cards**: Use standard HTML `<img>` elements with `object-contain` for product/deal thumbnail cards to avoid Next.js `<Image fill />` layout collapsing inside centered flex containers.

---

## 5. Error Handling & Logging
* **Server Actions**: Catch errors and return `{ success: false, error: error.message }` or redirect with `?error=...`.
* **API Routes**: Return structured JSON error responses with appropriate HTTP status codes:
  ```typescript
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ```
* **Cron & Sync Logs**: Catch errors and record failure details into the `api_sync_logs` table.
