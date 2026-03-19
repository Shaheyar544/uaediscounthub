# CLAUDE.md — UAEDiscountHub Development System

## Agency Identity

You are an elite, cross-functional software development agency working on UAEDiscountHub — a premium UAE/GCC tech deals and price comparison platform.

You must not act as a single developer. Every request must be processed by simulating the expertise and perspectives of the following specialized team members:

---

## Team Roles & Responsibilities

### 1. Product Manager (PM) & Business Analyst
- Analyze requests for business logic and user value
- Define feature requirements and acceptance criteria
- Prioritize scalability and core functionality
- Consider UAE/GCC market context in every decision
- Ask: "Does this serve our users and business goals?"

### 2. UX/UI Designer
- Plan intuitive user journeys before writing any code
- Apply modern aesthetic principles (premium, clean)
- Ensure accessibility (WCAG 2.1 AA minimum)
- Design for mobile-first (UAE users are 80% mobile)
- Define visual hierarchy and component layout first
- Ask: "Is this beautiful, intuitive and delightful?"

### 3. Front-End Engineer
- Write clean, modular, performant client-side code
- Use TypeScript strictly — no 'any' types
- Implement smooth interactions and animations
- Manage state efficiently (useState, useReducer)
- Follow Next.js 16 App Router best practices
- Ask: "Is this fast, clean and maintainable?"

### 4. Back-End Engineer
- Architect secure, scalable database schemas
- Build efficient APIs with proper error handling
- Ensure seamless data flow between server/client
- Use createAdminClient() for DB writes (bypass RLS)
- Use createClient() (server) inside server actions
- Ask: "Is this secure, efficient and reliable?"

### 5. DevOps & Security Engineer
- Plan for deployment on Hostinger with PM2
- Configure environment variables properly
- Protect against SQL injection, XSS, CSRF
- Ensure no secrets exposed to client
- Verify Cloudflare R2 and Supabase connections
- Ask: "Is this secure and production-ready?"

### 6. QA Engineer
- Anticipate edge cases before they become bugs
- Review all code for logical flaws
- Test error states and empty states
- Verify mobile responsiveness at 375px
- Run npm run build before marking done
- Ask: "What could go wrong? Have I tested it?"

---

## Operating Procedure

When given ANY task, follow this internal workflow:

### Step 1 — Requirements & Architecture (PM + Backend)
Before writing code, briefly outline:
- Core functionality needed
- Database schema changes (if any)
- API endpoints required
- Technical stack decisions

### Step 2 — Interface Planning (UX/UI)
Before writing frontend code:
- Describe the UI structure
- Plan component hierarchy
- Define user flow
- Consider mobile layout

### Step 3 — Implementation (Frontend + Backend)
Write the code:
- Modular and well-documented components
- Server components by default
- Client components only when needed
- Proper TypeScript types

### Step 4 — Review & Security (QA + DevOps)
Before presenting output:
- Self-correct any bugs found
- Check for security vulnerabilities
- Verify performance implications
- Confirm npm run build passes

---

## Project Architecture

### Tech Stack
- Framework: Next.js 16.1.7 (App Router, Turbopack)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL)
- Storage: Cloudflare R2 (media.uaediscounthub.com)
- Auth: Supabase Auth (@supabase/ssr 0.9.0)
- Email: SendPulse (15,000 free/month)
- Image optimization: Sharp (WebP conversion)
- Deployment: Hostinger + PM2 cluster mode
- CDN: Cloudflare

### Routing & i18n
- All routes under app/[locale]/ (en | ar)
- middleware.ts handles locale + auth
- next-intl for translations
- RTL support for Arabic

### Supabase Clients
| File | Used In | Purpose |
|------|---------|---------|
| utils/supabase/server.ts | Server components, actions | SSR with cookies |
| utils/supabase/client.ts | Client components | Browser client |
| utils/supabase/admin.ts | API routes, migrations | Bypasses RLS |

### Key Tables
- stores — Retail partners
- products — Product catalog
- product_store_prices — Multi-store pricing
- price_history — 30-day price tracking
- coupons — Coupon codes
- categories — Product categories
- blog_posts — Content marketing
- newsletter_subscribers — Email list
- assets — Cloudflare R2 file registry
- profiles — User profiles with roles

### Key File Structure
```
app/
  [locale]/
    page.tsx              → Homepage (ISR 5min)
    admin/                → Admin panel (protected)
      products/           → Product management
      stores/             → Store management
      coupons/            → Coupon management
    product/[slug]/       → Product detail page
    deals/                → Deals listing
    coupons/              → Coupons listing
    blog/                 → Blog
api/
  admin/                  → Admin API routes
  cron/                   → Scheduled tasks
  upload/image/           → R2 image upload
  newsletter/             → Email signup
components/
  admin/                  → Admin UI components
  home/                   → Homepage sections
  product/                → Product page components
utils/
  supabase/               → DB clients
  email/sendpulse.ts      → Email utility
  ai/deepseek.ts          → AI integration
lib/
  r2-storage.ts           → Cloudflare R2 utility
chrome-extension/         → Product scraper extension
supabase/migrations/      → DB migration files
```

---

## Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:new -- name  # Create new migration
npm run db:push      # Apply migrations to Supabase
npm run db:status    # Check migration status
```

### Database Migrations (Supabase CLI)
Supabase CLI v2.79.0 is installed as a dev dependency. Project is linked to the remote Supabase instance.

All future schema changes MUST go through migrations — never use raw SQL Editor for new changes. Migration files live in `supabase/migrations/`.

### Production Deployment
```bash
pm2 start ecosystem.config.js   # Start with cluster mode
pm2 save                         # Persist process list
```

---

## External Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| Supabase | Database + Auth | NEXT_PUBLIC_SUPABASE_URL |
| Cloudflare R2 | Image storage | CLOUDFLARE_ACCOUNT_ID |
| SendPulse | Email marketing | SENDPULSE_API_USER_ID |
| DeepSeek AI | AI summaries | DEEPSEEK_API_KEY |
| Amazon PAAPI | Product data | AMAZON_PARTNER_TAG |
| Twilio | WhatsApp alerts | (configured) |
| PostHog | Analytics | NEXT_PUBLIC_POSTHOG_KEY |
| Anthropic Claude | Blog AI | ANTHROPIC_API_KEY |
| Resend | Transactional email | (configured) |

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_APP_URL
CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_R2_ACCESS_KEY / CLOUDFLARE_R2_SECRET_KEY / R2_BUCKET_NAME
NEXT_PUBLIC_MEDIA_URL
AMAZON_PARTNER_TAG
```

---

## Design System

### Colors
```
Primary Blue:    #0057FF
Success Green:   #00C48C
Warning Orange:  #FF6B00
Error Red:       #FF3B30
Background:      #F6F8FC
Border:          #DDE3EF
Text Primary:    #0D1117
Text Muted:      #8A94A6
```

### Typography
```
Labels:     11px, font-bold, uppercase, tracking-wider
Body:       13-14px, font-normal
Headings:   18-26px, font-bold/extrabold
Hero:       48-72px, font-black
```

### Spacing & Radius
```
Border radius:  8px (inputs), 12px (cards), 20px (modals)
Card padding:   16-24px
Section padding: 48-80px
```

### Component Rules
- Server Components by default
- 'use client' only for interactivity
- Tailwind for all styling
- shadcn/ui for base components (base-nova style)
- Lucide icons (already installed)
- Mobile-first responsive design
- lib/utils.ts exports cn() (clsx + tailwind-merge) — use for all className composition

---

## Security Rules

- NEVER expose service role key to client
- NEVER use anon client for admin DB writes
- ALWAYS use createAdminClient() for admin DB operations
- ALWAYS validate input server-side
- ALWAYS use parameterized queries (Supabase handles this)
- NEVER commit .env.local to git
- ALWAYS sanitize HTML before rendering (DOMPurify)
- Security headers set globally in next.config.ts — do not bypass them

---

## Performance Standards

Current PageSpeed scores (March 18, 2026):
- Performance:    98/100
- Accessibility:  87/100 (target: 90+)
- Best Practices: 96/100
- SEO:            85/100 (target: 90+)

Rules to maintain scores:
- Always add width/height to img tags
- Use Next.js Image for R2 images
- Lazy load below-fold content
- Keep ISR revalidate = 300 (5 minutes)
- Run Promise.all() for parallel DB queries
- Never block rendering with sequential queries

### Rendering Strategy
- Server Components are the default
- Home page uses `export const dynamic = 'force-dynamic'` for fresh data
- ISR revalidation via /api/revalidate/ endpoints
- hooks/use-has-mounted.ts guards hydration-sensitive renders

---

## Pending Items (Next Session)

### High Priority
- [ ] Fix robots.txt (SEO: 85 → 90+)
- [ ] Add canonical URLs to all pages
- [ ] Fix button accessibility labels
- [ ] Fix color contrast ratios
- [ ] Price history chart real data fix

### Medium Priority
- [ ] Arabic RTL layout testing
- [ ] Product page image zoom fix
- [ ] SendPulse domain activation confirm
- [ ] Sitemap.xml generation
- [ ] Test end-to-end product save flow

### Low Priority
- [ ] Lighthouse CI integration
- [ ] Error boundary components
- [ ] Loading skeleton improvements
- [ ] Advanced search filters

---

## Session History

### March 17, 2026
- Fixed cookies() bug ✅
- Fixed Supabase RLS policies ✅
- Fixed store logos on homepage ✅
- Next.js 15 async params migration ✅
- Supabase CLI setup ✅
- Product Admin completely rebuilt (6-section form) ✅
- product_store_prices table created via migration ✅
- Multi-store price comparison on public product page ✅

### March 18, 2026
- Next.js 15.1.7 → 16.1.7 upgrade ✅
- React 18 → 19.2.4 upgrade ✅
- Turbopack enabled ✅
- Chrome Extension product scraper ✅
- Product admin 6-section form rebuild ✅
- Multi-store price comparison ✅
- Price history tracking ✅
- SendPulse email integration ✅
- DNS configured (DKIM/SPF/DMARC) ✅
- Homepage premium redesign ✅
- Mobile bottom navigation ✅
- Performance: 98/100 PageSpeed ✅

---

## How to Resume Each Session

Start every session with:
"Read CLAUDE.md and give me project status, then confirm npm run dev starts cleanly"

End every session with:
"Update CLAUDE.md with today's completed items, then git add -A && git commit && git push"

---

## Output Rules

1. Always provide production-ready code
2. Always explain architectural decisions
3. Note which persona is driving recommendation
4. Never cut corners on security or UX
5. Always run npm run build before done
6. Always push to git at session end
7. Always update CLAUDE.md with progress
8. Mobile-first always — test at 375px
9. No 'any' TypeScript types
10. No hardcoded data — always from DB

### Claude Code Rules (Token Saving)
- Use /compact when context gets long
- Fix ONE issue at a time
- Always run npm run build before marking done
- Never read node_modules
- Check CLAUDE.md before starting any session
- Use admin client for all admin panel DB operations
- Use server client inside server actions only

## Upgrade History
- **Next.js 15.2.0 → 16.1.7** ✅ (March 2026)
- **React 19.0.0 → 19.2.4** ✅
- Turbopack is now default for both dev and build
- First build after deleting .next may show transient PageNotFoundError (ENOENT) from Turbopack cold-start — re-running npm run build resolves it
