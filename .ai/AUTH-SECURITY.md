---
area: auth-and-security
importance: critical
last-reviewed: 2026-09-24
source-of-truth:
  - utils/auth/admin.ts
  - utils/auth/require-admin.ts
  - utils/supabase/middleware.ts
  - utils/supabase/server.ts
  - utils/supabase/admin.ts
---

# Authentication & Security Architecture

## 1. Authentication Mechanism
Authentication is managed via **Supabase Auth SSR** using `@supabase/ssr`. Sessions are stored in HTTP-only encrypted cookies and automatically refreshed on incoming requests via Next.js Middleware.

---

## 2. Authorization & Role Model (RBAC)

### A. Role Storage & Trust Boundary
* User roles are stored in the JWT **`app_metadata.role`** (e.g. `'admin'`).
* `app_metadata` is cryptographically signed by Supabase and **cannot be modified by regular users** from the client SDK (unlike `user_metadata`).
* The role is mirrored to the `profiles` table for database query joins.

### B. Admin Guard Helpers
* **`hasAdminRole(user)` (`utils/auth/admin.ts`)**:
  ```typescript
  export function hasAdminRole(user: Pick<User, 'app_metadata'> | null | undefined) {
    return user?.app_metadata?.role === 'admin'
  }
  ```
* **`requireAdmin()` (`utils/auth/require-admin.ts`)**:
  Used inside Server Components and Server Actions to enforce authorization. Throws `AdminAuthError(401)` if unauthenticated, or `AdminAuthError(403)` if not an admin.

---

## 3. Middleware & Route Protection (`utils/supabase/middleware.ts`)
* **Session Refresh**: Every incoming request passes through `updateSession` to refresh expired Supabase auth cookies.
* **Admin Page Protection**: Any request to `/[locale]/admin/*` (excluding `/api/*`) verifies the user session and admin role:
  * If no user $\rightarrow$ Redirect to `/[locale]/login`
  * If user lacks `admin` role $\rightarrow$ Redirect to `/[locale]`

---

## 4. API & Background Task Protection
1. **Admin Route Handlers**: Verify admin session via `createClient()` and `hasAdminRole()`.
2. **Automated Background Cron APIs (`/api/admin/cron/update-prices`)**:
   * Protected by a secret Bearer Token (`IMPORT_API_KEY`).
   * Evaluated via `isAuthorized(req)`:
     ```typescript
     function isAuthorized(req: NextRequest): boolean {
       const authHeader = req.headers.get('authorization') || '';
       const token = authHeader.replace(/^Bearer\s+/i, '').trim();
       const expected = process.env.IMPORT_API_KEY;
       return !!(expected && token === expected);
     }
     ```

---

## 5. File Upload & HTML Sanitization Security
* **R2 Uploads (`lib/r2-storage.ts`)**:
  * Accepts only safe image MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
  * Enforces maximum file size limit (5MB).
  * Generates sanitized, timestamped UUID filenames before saving to Cloudflare R2 bucket.
* **Rich Text HTML Sanitization (`lib/sanitize-html.ts`)**:
  * User-generated or AI-generated HTML is sanitized using `isomorphic-dompurify` before rendering to prevent Cross-Site Scripting (XSS).

---

## 6. Environment Secret Classification

### Public Variables (`NEXT_PUBLIC_*`)
* `NEXT_PUBLIC_SUPABASE_URL` — Supabase Project URL
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Anonymous Client Key
* `NEXT_PUBLIC_SITE_URL` — Canonical domain (`https://uaediscounthub.com`)

### Confidential Server Secrets (NEVER Expose to Client)
* `SUPABASE_SERVICE_ROLE_KEY` — Supabase Admin Client (bypasses RLS)
* `IMPORT_API_KEY` — Bearer secret for cron price sync
* `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — Cloudflare R2 credentials
* `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG` — Amazon PA-API
* `DEEPSEEK_API_KEY` — AI content generation
* `RESEND_API_KEY` & `TWILIO_AUTH_TOKEN` — Notifications & alerts
