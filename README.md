# 🛍️ UAE Discount Hub (UAEDiscountHub)

**UAE Discount Hub** is a premium, AI-powered price comparison and deal aggregation platform specifically designed for the **UAE, KSA, and GCC** markets. We help savvy shoppers find the absolute best prices on electronics, gadgets, and home appliances by tracking multiple retailers in real-time.

---

## ✨ Key Features

- 🤖 **AI-Powered Insights**: Automated pros & cons and deal summaries for every product using DeepSeek AI.
- 📊 **Price History Tracking**: 30-day visual price trend charts for every item.
- 🏢 **Multi-Store Comparison**: Side-by-side price tables for major retailers like Amazon AE, Noon, Sharaf DG, and more.
- 🎫 **Coupon Management**: Verified discount codes and promo codes with easy "Click-to-Copy" functionality.
- 🌍 **Full i18n Support**: Native English and Arabic support with SEO optimization for the Middle East.
- 🔔 **WhatsApp Alerts**: Instant notification when your favorite products hit their target price.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Engine**: [DeepSeek API](https://deepseek.com/)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Shaheyar544/uaediscounthub.git
cd uaediscounthub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase and AI keys.
```bash
cp .env.example .env.local
```

### 4. Run the development server
```bash
npm run dev
```

## 📂 Project Structure

- `/app`: Next.js pages and routing.
- `/components`: Reusable UI components (shadcn/ui inspired).
- `/hooks`: Custom React hooks (e.g., `useHasMounted` for hydration safety).
- `/supabase`: Database schema and SQL migrations.
- `/i18n`: Localization dictionaries for English and Arabic.

## 📄 License

Copyright © 2024 UAEDiscountHub. All rights reserved.
Built with ❤️ in Dubai, UAE.
