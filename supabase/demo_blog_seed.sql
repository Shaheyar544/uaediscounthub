-- SEED DATA FOR DEMO PURPOSES
-- FIXED: Using strictly numeric UUIDs to guarantee valid hexadecimal syntax

-- 1. CATEGORIES
INSERT INTO blog_categories (id, name, slug, color, icon) VALUES
('11111111-1111-1111-1111-111111111111', 'Buying Guides', 'buying-guides', '#FF6B00', '💡'),
('22222222-2222-2222-2222-222222222222', 'Deal Alerts', 'deal-alerts', '#0057FF', '🛒'),
('33333333-3333-3333-3333-333333333333', 'Tech Reviews', 'tech-reviews', '#00C48C', '📱');

-- 2. TAGS
INSERT INTO blog_tags (id, name, slug) VALUES
('00000000-0000-0000-0000-000000000001', 'Amazon UAE', 'amazon-uae'),
('00000000-0000-0000-0000-000000000002', 'Noon Deals', 'noon-deals'),
('00000000-0000-0000-0000-000000000003', 'Ramadan 2025', 'ramadan-2025'),
('00000000-0000-0000-0000-000000000004', 'iPhone', 'iphone'),
('00000000-0000-0000-0000-000000000005', 'Promo Codes', 'promo-codes');

-- 3. DEMO POSTS
INSERT INTO blog_posts (
  id, title, subtitle, slug, content, excerpt, 
  featured_image, status, published_at, 
  category_id, author_id, reading_time_min, is_featured, locale, view_count
) VALUES
-- Post 1: Featured Post
(
  '99999999-9999-9999-9999-999999999901',
  'The Ultimate Guide to Ramadan Sales 2025: Best Deals Across Amazon UAE, Noon & Carrefour',
  'Everything UAE shoppers need to know about scoring the best Ramadan discounts this year.',
  'ultimate-guide-ramadan-sales-2025',
  '<h2>When Do the Real Deals Start?</h2><p>Based on our price tracking data across the past 3 Ramadans, the best electronics deals appear in Week 1 (Days 1–7) while fashion and home goods peak in the final week before Eid. Grocery savings are consistent throughout.</p><blockquote>Quick Tip: The first 3 days and the last 3 days of Ramadan consistently see the steepest price drops.</blockquote><h2>Amazon UAE: What to Buy</h2><p>Amazon UAE''s "Ramadan Offers" page typically goes live 3 days before Ramadan starts and escalates daily.</p>',
  'Everything UAE shoppers need to know about scoring the best Ramadan discounts this year — from timing strategies to exclusive promo codes.',
  'https://images.unsplash.com/photo-1511139082563-c2920ea7d748?auto=format&fit=crop&q=80&w=1200',
  'published',
  NOW() - INTERVAL '1 day',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  8,
  true,
  'en',
  12430
),
-- Post 2: Tech Post
(
  '99999999-9999-9999-9999-999999999902',
  'iPhone 15 vs Samsung S24: Which is the Better Buy in UAE Right Now?',
  'We compared prices across 5 UAE stores plus current coupon codes to find the real best deal.',
  'iphone-15-vs-samsung-s24-uae',
  '<p>Choosing between the latest flagships is harder than ever. In the UAE market, availability and regional warranties play a huge role.</p><h3>Price Comparison</h3><p>We tracked the 256GB models across Noon, Amazon, and Sharaf DG.</p>',
  'We compared prices across 5 UAE stores plus current coupon codes to find the real best deal.',
  'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&q=80&w=1200',
  'published',
  NOW() - INTERVAL '3 days',
  '33333333-3333-3333-3333-333333333333',
  NULL,
  5,
  false,
  'en',
  8900
),
-- Post 3: Home/Deal Post
(
  '99999999-9999-9999-9999-999999999903',
  'Carrefour vs IKEA: Best Home Appliance Deals This Month',
  'We tracked prices on over 50 home items. Here''s what is actually worth buying.',
  'carrefour-vs-ikea-home-deals',
  '<p>Updating your home doesn''t have to break the bank. This month, Carrefour is leading on small appliances while IKEA remains king of modular storage.</p>',
  'We tracked prices on over 50 home items. Here is what is actually worth buying and with which coupons.',
  'https://images.unsplash.com/photo-1556911220-ebd537d8ef5c?auto=format&fit=crop&q=80&w=1200',
  'published',
  NOW() - INTERVAL '5 days',
  '22222222-2222-2222-2222-222222222222',
  NULL,
  4,
  false,
  'en',
  4500
),
-- Post 4: Finance Post
(
  '99999999-9999-9999-9999-999999999904',
  'Best UAE Credit Cards for Online Shopping Cashback (2025)',
  'Stack credit card rewards with our coupon codes for double savings.',
  'best-uae-credit-cards-cashback-2025',
  '<p>Maximize your savings by using the right card. Some cards offer up to 10% back on Noon or Amazon purchases during specific windows.</p>',
  'Stack credit card rewards with our coupon codes for double savings — here are the best combos.',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200',
  'published',
  NOW() - INTERVAL '7 days',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  6,
  false,
  'en',
  3200
);

-- 4. POST-TAG RELATIONS
INSERT INTO blog_post_tags (post_id, tag_id) VALUES
('99999999-9999-9999-9999-999999999901', '00000000-0000-0000-0000-000000000001'),
('99999999-9999-9999-9999-999999999901', '00000000-0000-0000-0000-000000000002'),
('99999999-9999-9999-9999-999999999901', '00000000-0000-0000-0000-000000000003'),
('99999999-9999-9999-9999-999999999902', '00000000-0000-0000-0000-000000000004'),
('99999999-9999-9999-9999-999999999904', '00000000-0000-0000-0000-000000000005');
