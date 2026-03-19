-- ============================================================
-- Create pages table + RLS + seed essential static pages
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pages (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug             TEXT        UNIQUE NOT NULL,
  title_en         TEXT        NOT NULL,
  title_ar         TEXT        DEFAULT '',
  content_en       TEXT        DEFAULT '',
  content_ar       TEXT        DEFAULT '',
  meta_title       TEXT,
  meta_description TEXT,
  canonical_url    TEXT,
  status           TEXT        DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  placement        TEXT        DEFAULT 'none'
                   CHECK (placement IN (
                     'none', 'header',
                     'footer_c1', 'footer_c2', 'footer_c3'
                   )),
  sort_order       INTEGER     DEFAULT 0,
  is_visible       BOOLEAN     DEFAULT true,
  is_active        BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pages_slug      ON public.pages (slug);
CREATE INDEX IF NOT EXISTS idx_pages_placement ON public.pages (placement, status);

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'pages_updated_at'
  ) THEN
    CREATE TRIGGER pages_updated_at
      BEFORE UPDATE ON public.pages
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Public SELECT (admins see all, public sees published)
DROP POLICY IF EXISTS "pages_select" ON public.pages;
CREATE POLICY "pages_select"
  ON public.pages FOR SELECT
  USING (true);

-- Admin-JWT gated writes
DROP POLICY IF EXISTS "pages_insert" ON public.pages;
CREATE POLICY "pages_insert"
  ON public.pages FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "pages_update" ON public.pages;
CREATE POLICY "pages_update"
  ON public.pages FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "pages_delete" ON public.pages;
CREATE POLICY "pages_delete"
  ON public.pages FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================
-- Seed 5 essential pages
-- ============================================================

INSERT INTO public.pages
  (slug, title_en, title_ar, content_en, content_ar,
   status, placement, sort_order, is_visible)
VALUES

-- About Us
('about', 'About Us', 'من نحن',
'<h1>About UAEDiscountHub</h1>
<p>We are the UAE''s leading price comparison and deals platform, helping shoppers find the best tech deals across all major retailers — in real time.</p>
<h2>Our Mission</h2>
<p>To help UAE shoppers save money by comparing prices across Amazon UAE, Noon, Sharaf DG, Carrefour and more — without visiting each site separately.</p>
<h2>What We Offer</h2>
<ul>
  <li>Real-time price comparison across 10+ UAE retailers</li>
  <li>Exclusive coupon codes updated daily</li>
  <li>WhatsApp price drop alerts</li>
  <li>AI-powered product summaries and buying guides</li>
  <li>30-day price history charts</li>
</ul>
<h2>Our Story</h2>
<p>Founded in Dubai in 2024 by tech enthusiasts who were frustrated with overpaying for gadgets. We built the tool we wished existed — and now share it with the entire GCC community.</p>',
'<h1>عن موقع UAEDiscountHub</h1>
<p>نحن منصة مقارنة الأسعار والعروض الرائدة في الإمارات، نساعد المتسوقين على إيجاد أفضل صفقات التقنية عبر كبرى تجار التجزئة في الوقت الفعلي.</p>
<h2>مهمتنا</h2>
<p>مساعدة المتسوقين في الإمارات على توفير المال من خلال مقارنة الأسعار عبر أمازون الإمارات ونون وشرف DG وكارفور وغيرها.</p>
<h2>ما نقدمه</h2>
<ul>
  <li>مقارنة الأسعار الفورية عبر أكثر من 10 متاجر إماراتية</li>
  <li>أكواد خصم حصرية يتم تحديثها يومياً</li>
  <li>تنبيهات انخفاض الأسعار عبر واتساب</li>
  <li>ملخصات منتجات بالذكاء الاصطناعي</li>
</ul>',
'published', 'footer_c3', 1, true),

-- Privacy Policy
('privacy-policy', 'Privacy Policy', 'سياسة الخصوصية',
'<h1>Privacy Policy</h1>
<p><strong>Last updated: March 2026</strong></p>
<p>This Privacy Policy explains how UAEDiscountHub collects, uses, and protects your information.</p>
<h2>Information We Collect</h2>
<ul>
  <li><strong>Account data:</strong> Email address when you register</li>
  <li><strong>Usage data:</strong> Pages visited, products viewed, searches</li>
  <li><strong>Alert preferences:</strong> WhatsApp number if you opt in</li>
  <li><strong>Newsletter:</strong> Email if you subscribe</li>
</ul>
<h2>How We Use Your Information</h2>
<ul>
  <li>To send price drop alerts you requested</li>
  <li>To deliver our newsletter (if subscribed)</li>
  <li>To improve our platform experience</li>
  <li>To analyze usage via PostHog analytics</li>
</ul>
<h2>Data Storage</h2>
<p>Data is stored securely using Supabase (AWS-hosted) with row-level security. We never sell your personal data.</p>
<h2>Cookies</h2>
<p>We use essential cookies for authentication. Analytics cookies (PostHog) help us improve the platform. You can opt out of analytics in your browser settings.</p>
<h2>Your Rights</h2>
<p>Request deletion of your account and data at any time: <strong>privacy@uaediscounthub.com</strong></p>',
'<h1>سياسة الخصوصية</h1>
<p><strong>آخر تحديث: مارس 2026</strong></p>
<p>تشرح سياسة الخصوصية هذه كيفية جمع UAEDiscountHub لمعلوماتك واستخدامها وحمايتها.</p>
<h2>المعلومات التي نجمعها</h2>
<ul>
  <li>عنوان البريد الإلكتروني عند التسجيل</li>
  <li>بيانات الاستخدام: الصفحات والمنتجات التي تمت زيارتها</li>
  <li>رقم واتساب إذا اشتركت في التنبيهات</li>
</ul>
<h2>حقوقك</h2>
<p>يمكنك طلب حذف حسابك وبياناتك عبر: privacy@uaediscounthub.com</p>',
'published', 'footer_c3', 2, true),

-- Terms of Service
('terms-of-service', 'Terms of Service', 'شروط الخدمة',
'<h1>Terms of Service</h1>
<p><strong>Last updated: March 2026</strong></p>
<h2>1. Use of Service</h2>
<p>UAEDiscountHub is a price comparison and deals platform. Prices shown are sourced from third-party retailers and may change without notice. Always verify the final price on the retailer''s website.</p>
<h2>2. Affiliate Links</h2>
<p>We participate in affiliate programs. Clicking product links may earn us a commission at no extra cost to you. This keeps our service free.</p>
<h2>3. Accuracy</h2>
<p>We strive for accuracy but cannot guarantee all information is current. We are not liable for purchasing decisions made based on our data.</p>
<h2>4. User Accounts</h2>
<p>You are responsible for your account credentials. Notify us immediately of any unauthorized access.</p>
<h2>5. Prohibited Use</h2>
<ul>
  <li>Automated scraping without permission</li>
  <li>Fraudulent use of coupon codes</li>
  <li>Attempting to access other users'' accounts</li>
</ul>
<h2>6. Limitation of Liability</h2>
<p>UAEDiscountHub is provided "as is". We are not liable for indirect or consequential damages.</p>
<h2>Contact</h2>
<p>Questions: <strong>legal@uaediscounthub.com</strong></p>',
'<h1>شروط الخدمة</h1>
<p><strong>آخر تحديث: مارس 2026</strong></p>
<h2>1. استخدام الخدمة</h2>
<p>UAEDiscountHub منصة مقارنة أسعار. الأسعار مصدرها تجار التجزئة وقد تتغير. تحقق دائماً من السعر النهائي على موقع التاجر.</p>
<h2>2. الروابط التابعة</h2>
<p>قد نكسب عمولة عند النقر على روابط المنتجات، دون أي تكلفة إضافية عليك.</p>
<h2>3. التواصل</h2>
<p>legal@uaediscounthub.com</p>',
'published', 'footer_c3', 3, true),

-- Contact Us
('contact', 'Contact Us', 'اتصل بنا',
'<h1>Contact Us</h1>
<p>Have a question, suggestion, or spotted a price error? We''d love to hear from you.</p>
<h2>Get In Touch</h2>
<ul>
  <li><strong>General inquiries:</strong> hello@uaediscounthub.com</li>
  <li><strong>Privacy questions:</strong> privacy@uaediscounthub.com</li>
  <li><strong>Business &amp; partnerships:</strong> business@uaediscounthub.com</li>
  <li><strong>Report a price error:</strong> Use the Report button on any product page</li>
</ul>
<h2>Response Time</h2>
<p>We typically respond within 24–48 hours, Sunday through Thursday (UAE business days).</p>
<h2>Location</h2>
<p>Dubai, United Arab Emirates 🇦🇪</p>',
'<h1>اتصل بنا</h1>
<p>هل لديك سؤال أو اقتراح؟ نسعد بالتواصل معك.</p>
<h2>تواصل معنا</h2>
<ul>
  <li><strong>الاستفسارات العامة:</strong> hello@uaediscounthub.com</li>
  <li><strong>الشراكات التجارية:</strong> business@uaediscounthub.com</li>
</ul>
<h2>وقت الاستجابة</h2>
<p>نرد عادةً خلال 24–48 ساعة من الأحد إلى الخميس.</p>
<p>دبي، الإمارات العربية المتحدة 🇦🇪</p>',
'published', 'footer_c3', 4, true),

-- FAQ
('faq', 'FAQ', 'الأسئلة الشائعة',
'<h1>Frequently Asked Questions</h1>
<h2>How does UAEDiscountHub work?</h2>
<p>We track prices from major UAE retailers and display them side-by-side so you instantly find the best deal — no tab-switching required.</p>
<h2>Is it free?</h2>
<p>Yes — completely free. We earn a small affiliate commission when you buy through our links, at no extra cost to you.</p>
<h2>How often are prices updated?</h2>
<p>Prices are refreshed every few hours. Always confirm the final price on the retailer''s website before purchasing.</p>
<h2>How do price drop alerts work?</h2>
<p>Set a target price on any product. When it drops to your target, you receive an instant WhatsApp notification.</p>
<h2>Which stores do you cover?</h2>
<p>Amazon UAE, Noon, Sharaf DG, Carrefour UAE, LuLu Hypermarket, Virgin Megastore, eXtra, and more — with new stores added regularly.</p>
<h2>Are coupon codes guaranteed?</h2>
<p>We verify codes regularly, but they may expire. If a code fails, hit the Report button and we''ll update it within 24 hours.</p>
<h2>Can I suggest a product?</h2>
<p>Absolutely — email us the product link at hello@uaediscounthub.com and we''ll add it to our tracker.</p>',
'<h1>الأسئلة الشائعة</h1>
<h2>كيف يعمل UAEDiscountHub؟</h2>
<p>نتتبع الأسعار من كبرى المتاجر الإماراتية ونعرضها جنباً إلى جنب لإيجاد أفضل صفقة فوراً.</p>
<h2>هل الخدمة مجانية؟</h2>
<p>نعم، مجانية تماماً. نكسب عمولة صغيرة عبر روابط الشراء دون تكلفة إضافية عليك.</p>
<h2>كيف تعمل تنبيهات انخفاض الأسعار؟</h2>
<p>حدد السعر المستهدف لأي منتج وسنرسل لك إشعاراً فورياً عبر واتساب عند انخفاض السعر.</p>
<h2>ما المتاجر التي تغطيها؟</h2>
<p>أمازون الإمارات، نون، شرف DG، كارفور، لولو هايبرماركت، فيرجن ميغاستور، إكسترا وغيرها.</p>',
'published', 'footer_c1', 5, true)

ON CONFLICT (slug) DO NOTHING;
