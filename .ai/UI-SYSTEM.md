---
area: ui-design-system
importance: high
last-reviewed: 2026-09-24
source-of-truth:
  - app/globals.css
  - components/ui/
  - components/layout/
---

# UI Design System & Component Reference

## 1. Design Tokens & Typography

### Fonts (`app/globals.css`)
* **Display / Headings**: `--font-outfit` (`Outfit`) — bold, geometric, modern branding.
* **Body / Content**: `--font-dm-sans` (`DM Sans`) — high legibility for product descriptions and tables.
* **Monospace / Codes**: `--font-geist-mono` (`Geist Mono`) — used for coupon promo codes, SKU, and ASIN numbers.

### Core Color Palette (CSS Variables)
| Token | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- |
| `primary` | `#0284c7` (Sky-600) | `#38bdf8` (Sky-400) | Main action buttons, links, active badges |
| `background` | `#ffffff` | `#090d16` (Deep Navy) | Page background |
| `card` | `#ffffff` | `#0e1424` | Deal/Coupon/Product cards |
| `secondary` | `#f1f5f9` | `#1e293b` | Subtle pill backgrounds, badges |
| `destructive`| `#ef4444` | `#f87171` | Delete buttons, expired badges |
| `border` | `#e2e8f0` | `#1e293b` | Card borders, dividers |
| `brand-gold` | `#f59e0b` | `#fbbf24` | Ratings, stars, best deal badges |
| `brand-green`| `#10b981` | `#34d399` | In stock, verified, discount savings |

---

## 2. Layout Structure & Responsive Design
* **Header / Navbar (`components/layout/Navbar.tsx`)**:
  * Desktop: Sticky top header with Logo, Navigation Links, Global Search, Locale Switcher (`AR`/`EN`), Theme Toggle, and Admin/User Menu.
  * Mobile: Compact top header with mobile bottom bar (`components/layout/MobileBottomNav.tsx`) providing thumb-friendly quick navigation (Home, Deals, Coupons, Compare, Menu).
* **Admin Layout (`components/admin/AdminAppShell.tsx`)**:
  * Desktop: Persistent left sidebar (`AdminSidebar.tsx`) with collapsible sections.
  * Topbar: Command Center search (`AdminCommandCenter.tsx`), Theme Toggle, and User Avatar menu.
  * Mobile: Sliding sheet drawer (`AdminMobileSidebar.tsx`).
* **Internationalization & RTL**:
  * Automatically handles RTL via CSS logical properties (`dir="rtl"` applied to `<html>`).
  * Flexbox/Grid layouts use start/end alignment rather than hardcoded left/right.

---

## 3. Reusable UI Components

### Base Components (`components/ui/`)
* **Button (`button.tsx`)**: Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
* **Input & Label (`input.tsx`, `label.tsx`)**: Standard form field controls.
* **Badge (`badge.tsx`)**: Tag indicators (Verified, Store Name, Category).
* **Card (`card.tsx`)**: Glassmorphic container styling.
* **Table (`table.tsx`)**: Clean data tables with responsive horizontal scrolling.
* **Switch / Checkbox (`switch.tsx`, `checkbox.tsx`)**: Boolean toggles for active/featured status.
* **Dropdown Menu & Sheet (`dropdown-menu.tsx`, `sheet.tsx`)**: Context menus and drawers.

### Specialized Domain Components
* **`DealCard.tsx`**: Optimized deal card with standard `<img>` tags (avoiding hydration collapsing bugs in flex grids) and R2 image fallback.
* **`CouponCardV2.tsx`**: Interactive coupon card with hidden code snippet, copy button, verified tag, and expiry countdown.
* **`PriceComparisonTable.tsx`**: Clean table listing retailers, current vs original prices, discount badges, and affiliate referral CTAs.
* **`CookieConsent.tsx`**: Bottom floating banner with smooth Framer Motion entry, bilingual text, and localStorage acceptance state.

### Rich Text Editors
* **`PostEditor.tsx` & `ProductRichEditor.tsx` & `PageEditor.tsx`**: TipTap-based WYSIWYG editor supporting Headings (H1–H4), Bold, Italic, Underline, Bullet/Numbered Lists, Tables, Images, and Custom Deal Embeds.
