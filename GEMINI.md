# UAE Discount Hub - Project Guidelines

## Tech Stack
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend/Database:** [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Analytics:** [PostHog](https://posthog.com/)
- **Communications:** [Resend](https://resend.com/) (Email), [Twilio](https://www.twilio.com/) (SMS/WhatsApp)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/)

## Project Goals
1.  **Centralized Discount Hub:** Provide a comprehensive platform for users in the UAE to discover coupons, deals, and discounts.
2.  **Price Comparison & Tracking:** Enable users to compare product prices across major UAE retailers and track price history.
3.  **Content Management:** A robust admin dashboard for managing blog posts, coupons, newsletters, and user data.
4.  **Localized Experience:** Full internationalization (i18n) support, primarily for English and Arabic.
5.  **Performance & SEO:** Optimize for fast loading times and search engine visibility.
6.  **AI Integration:** Leverage AI for content assistance and data summarization.

## Coding Guidelines

### General Principles
- **Clean Code:** Follow SOLID principles and write readable, maintainable code.
- **Type Safety:** Use TypeScript strictly. Avoid `any`; define proper interfaces and types for all data structures and component props.
- **Functional Components:** Prefer functional components with React Hooks over class components.
- **Modular Architecture:** Keep components small, focused, and reusable. Separate business logic from UI where possible.

### Next.js & React
- **App Router:** Adhere to the Next.js App Router conventions (server vs. client components).
- **Server Components by Default:** Use Server Components whenever possible to minimize client-side JavaScript.
- **Data Fetching:** Use Supabase client/server utilities for efficient data operations.

### Styling & UI
- **Tailwind CSS:** Use Tailwind for all styling. Follow the existing design system and utility patterns.
- **Consistency:** Use components from `components/ui` (Shadcn) to maintain visual consistency.
- **Accessibility:** Ensure all components are accessible (ARIA labels, keyboard navigation).

### Internationalization (i18n)
- All user-facing text must be internationalized using the established i18n framework (`i18n/` directory).
- Support for RTL (Right-to-Left) layouts for Arabic.

### Performance
- Optimize images using `next/image`.
- Implement proper loading states and error boundaries.
- Keep third-party scripts to a minimum or load them efficiently.

## Current Progress & Completed Modules

### 1. Admin Dashboard Core
- **Hydration Fixes:** Resolved critical SSR/CSR mismatches in `AdminSidebar` and `AdminLayout` related to `ThemeProvider` nesting and browser-extension attributes (`fdprocessedid`).
- **Unified Navigation:** Updated `AdminSidebar` with active state tracking and specialized icons for all management modules.

### 2. Categories Management (`/admin/categories`)
- **Data Table:** Implemented a robust listing of categories with status indicators (Active/Inactive).
- **Form Modal:** Created a comprehensive modal for adding/editing categories including:
    - Real-time slug generation from English name.
    - Multilingual support (English/Arabic names and descriptions).
    - Icon/Image URL preview and integration.

### 3. Pages Management (`/admin/pages`)
- **Full-Screen Editor:** Developed a dedicated `PageEditor` using Tiptap for rich text content.
- **Multilingual Content:** Implemented synchronized state for English and Arabic content with specialized RTL support for the Arabic editor.
- **Placement System:** Added navigation metadata allowing pages to be assigned to `Header`, `Footer: Quick Links`, `Footer: Stores`, or `Footer: Connect`.
- **Dynamic Integration:** Updated `Navbar` and `Footer` components to fetch and render these pages dynamically from Supabase based on their placement and visibility status.

### 4. Stores Management (`/admin/stores`)
- **Retailer Database:** Management system for featured stores (Amazon, Noon, Carrefour, etc.).
- **Featured Status:** Ability to flag stores for home-page display and manage their display order.
- **Affiliate Links:** Centralized management of base affiliate redirect URLs.

### 5. Advanced Settings (`/admin/settings`)
- **Promotions:** Global toggle and configuration for the site-wide announcement top bar with countdown timers.
- **Affiliate Integrations:** Expanded support for Noon, Sharaf DG, and Carrefour tracking IDs.
- **Social & Contact:** Centralized management for WhatsApp Alerts, X, LinkedIn, and Instagram URLs.
- **Localization:** Regional targeting (UAE, KSA, GCC) and default currency settings.

### 6. Amazon Creators API Integration
- **LwA v3 Auth:** Implemented the latest OAuth 2.0 (Login with Amazon) Client Credentials flow.
- **Hybrid Architecture:** Successfully configured PA-API 5.0 operations (SearchItems, GetItems) to run over the Creators OAuth Bearer token.
- **Regional Optimization:** Optimized for the UAE marketplace using `webservices.amazon.ae` and `creatorsapi::default` scope.
- **API Sandbox:** Built an isolated testing environment in the admin panel for real-time keyword searches and ASIN lookups.

### 7. Cloudflare R2 Storage
- **Infrastructure:** Integrated AWS S3 SDK pointing to Cloudflare R2 endpoints.
- **Image API:** Created a secure `/api/upload/image` route with file type validation (JPEG, PNG, WebP) and size limits (2MB).
- **Custom Domain:** Configured `media.uaediscounthub.com` for high-performance content delivery.

## Blog System Architecture
1. **Stack:** Built with Next.js 15 (App Router), Supabase (PostgreSQL + Storage), Tailwind CSS v4, and TypeScript.
2. **Next.js 15 Rules:** Always await `searchParams` and `params` in page components before accessing their properties.
3. **Styling:**
   - Rich text styling is powered by `@tailwindcss/typography` (imported via `@plugin` in `globals.css`).
   - Main content containers use `max-w-7xl mx-auto` for a consistent, expansive layout.
4. **CMS:** A custom CMS is located at `/admin/blog`.
   - **Editor:** Tiptap-based rich text editor with custom toolbar.
   - **Images:** `sharp` is used for processing and compressing uploads to WebP format.
   - **AI:** Integrated with Anthropic (Claude) for smart writing assistance and SEO improvements.
5. **Admin Layout:** The `AdminSidebar` is managed globally in `app/[locale]/admin/layout.tsx`. Individual admin pages must **NOT** render their own sidebar to prevent duplication.
6. **Database:** Tables include `blog_posts`, `blog_categories`, `blog_tags`, and `blog_ad_widgets`. All tables are secured with Row Level Security (RLS) in Supabase.
