# AGENTS.md

## Purpose

This file defines the working conventions for agents operating in this repository. It is based on the current implementation patterns in [`app/[locale]/page.tsx`](F:\uaediscounthub\app\[locale]\page.tsx), [`app/[locale]/search/page.tsx`](F:\uaediscounthub\app\[locale]\search\page.tsx), [`app/globals.css`](F:\uaediscounthub\app\globals.css), [`components/admin/pages/PageEditor.tsx`](F:\uaediscounthub\components\admin\pages\PageEditor.tsx), and [`components/home/CategoryBrowsing.tsx`](F:\uaediscounthub\components\home\CategoryBrowsing.tsx).

Use this as the default standard unless the user explicitly asks for a different direction.

## 1. Project Architecture

### Framework shape

- The app uses `Next.js` App Router with locale-segment routing under `app/[locale]`.
- Route files are primarily async server components and receive `params` and `searchParams` as promises, then `await` them inside the route.
- Prefer server-rendered pages for data fetching and initial page composition. Move to client components only for interaction, editor state, localStorage access, animation control, or browser-only APIs.

### Supabase usage

- Supabase logic is split by runtime:
  - Server-side reads use `createClient()` from `@/utils/supabase/server`.
  - Client-side mutations or authenticated browser interactions use `createClient()` from `@/utils/supabase/client`.
- Current route style favors direct Supabase queries inside the route rather than adding an extra service layer for simple reads.
- Parallelize unrelated reads with `Promise.all`, as in the home page.
- Keep selection payloads explicit enough to support the UI but avoid unnecessary joins or overfetching.
- Derive lightweight view models close to the query site when the logic is page-specific, for example:
  - computing category counts
  - selecting a best price from `product_prices`
  - ranking search results after retrieval

### Rendering boundaries

- Keep the server/client boundary intentional:
  - Server page composes data-heavy sections.
  - Client components own ephemeral UI state, animation toggles, form submission state, and rich text editing.
- Hydration-sensitive UI should use the existing `useHasMounted` guard pattern rather than rendering unstable client-only output on first paint.

### Error handling

- Existing style handles route-level failures inline with a visible fallback UI instead of silently swallowing exceptions.
- For admin/client mutations, use straightforward `try/catch`, `console.error`, and user-visible alerts when no toast system is already wired in that flow.

## 2. UI Standards

### Tailwind v4 patterns

- Styling is utility-first and leans heavily on Tailwind v4 plus theme variables declared in [`app/globals.css`](F:\uaediscounthub\app\globals.css).
- The codebase currently mixes:
  - semantic tokens such as `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`
  - explicit one-off values such as `bg-[#F6F8FC]`, `text-[#0057FF]`, `rounded-[14px]`, `border-[1.5px]`
- Preserve that balance:
  - use semantic tokens for shared surfaces and site-wide consistency
  - use direct hex and arbitrary values where a premium/admin surface needs a very specific look

### Layout and spacing

- Favor clean, card-based layouts with generous spacing.
- Common patterns in current edits:
  - centered page containers like `max-w-6xl` and `max-w-7xl`
  - rounded cards with medium-large radii
  - light borders with subtle shadows
  - stacked sections using `space-y-*`
  - responsive grids rather than deeply nested flex layouts

### Visual language

- Brand direction in CSS is blue/orange with restrained neutral backgrounds.
- Typography is intentional:
  - headings use display font variables
  - body copy uses body font variables
  - admin labels lean uppercase, compact, and high-contrast
- Components often use strong emphasis through:
  - `font-black` and `font-extrabold`
  - badge-style pills
  - gradient text or gradient backgrounds for marketing sections
  - hover states that combine border, shadow, color, and scale changes

### Framer Motion

- Use `framer-motion` for meaningful state or entrance transitions, not generic animation everywhere.
- Current style uses motion sparingly for confirmation and reveal moments.
- Prefer CSS keyframes or Tailwind animation utilities for lightweight ambient effects such as:
  - floating icons
  - marquees
  - gradient shifts
  - pulse/live badges
- When adding motion:
  - keep durations short and readable
  - avoid excessive springiness on admin surfaces
  - respect hover pause or reduced-distraction behavior when content moves continuously

## 3. Component Guidelines

### General shared UI

- Shared components should accept already-shaped props and stay presentation-focused.
- Keep data access near route boundaries unless a client component truly owns the interaction.
- Prefer small helpers inside the component over premature abstraction when logic is local and readable.
- Use `lucide-react` icons consistently for admin controls, badges, and lightweight affordances.

### TipTap in `PageEditor.tsx`

- `PageEditor` is a client-only admin component and should stay that way.
- Maintain one editor instance per language tab rather than reusing a single instance for bilingual content.
- Keep editor configuration explicit and colocated:
  - `StarterKit`
  - `Link`
  - `Placeholder`
  - `Underline`
  - `TextAlign`
- Preserve `immediatelyRender: false` to avoid hydration/render timing issues with TipTap.
- Sync editor HTML back into React state through `onUpdate`, and use that state as the source for save operations.
- Template application should update both the editor content and the backing page state.
- Continue using `useHasMounted` for editor-heavy screens to avoid rendering unstable editor markup before the client is ready.

### Admin UI behavior

- Admin components in this repo favor dense but polished interfaces:
  - compact toolbars
  - clear section cards
  - inline validation hints
  - immediate action buttons for save/preview/template switching
- If adding new admin controls, match the existing visual grammar instead of switching to default browser or bare shadcn styling unless the surrounding screen already uses that system.

### Home/shared marketing components

- Home page components can be more expressive than admin components.
- It is acceptable to use:
  - gradients
  - animated badges
  - hover transforms
  - inline `<style jsx>` for localized animation definitions
- Keep browser-only measurements and resize listeners isolated to client components, as shown in `CategoryBrowsing`.

## 4. Tech Stack Specifics

### React 19 usage in this repo

- The project runs on `react@19.2.4` and `react-dom@19.2.4`.
- Patterns currently in use include:
  - async server components in App Router pages
  - client/server separation via `'use client'`
  - `useTransition` for non-blocking async UI actions
  - server actions invoked from client components
- Existing `useTransition` usage appears in components such as:
  - newsletter subscription flows
  - AI summary generation buttons
  - price alert interactions elsewhere in the repo

### Practical guidance

- Prefer `useTransition` when a client action kicks off async work and the UI should remain responsive.
- Keep form and editor state local with `useState` unless there is a strong reason to centralize.
- Do not add memoization hooks by default. Follow the current repo style and only introduce them when profiling or a known rerender problem justifies it.
- For server routes, favor plain async functions and direct awaits over unnecessary wrapper layers.

### Next.js conventions

- Use route-level caching intentionally. The home page currently uses `revalidate = 300`, which indicates a preference for ISR where data is fresh enough without forcing full dynamic rendering.
- Use `next/image` for image-heavy surfaces when remote hosts are already configured in [`next.config.ts`](F:\uaediscounthub\next.config.ts).
- Keep locale-aware routing explicit in links and redirects.

## 5. Coding Style Inferred From Current Edits

- Prefer direct, readable code over abstraction-heavy architecture.
- Use comments sparingly and only where they clarify section intent or a non-obvious decision.
- Keep UI class strings inline when the styling is local to a component.
- Use descriptive small helper functions inside a file when they improve readability, for example slug generation or best-price selection.
- Write interfaces near the component that consumes them when the types are screen-specific.
- Favor pragmatic solutions first:
  - inline ranking after search results are fetched
  - inline template arrays for admin content
  - inline fallback values for imperfect data

## 6. What Agents Should Avoid

- Do not introduce a broad service/repository abstraction unless repeated logic clearly warrants it.
- Do not convert polished custom admin screens into generic shadcn-only layouts.
- Do not move interactive browser logic into server components.
- Do not remove hydration guards around TipTap or other client-only UI without verifying the effect.
- Do not replace explicit visual values with tokens everywhere; this codebase currently relies on a hybrid design system.
