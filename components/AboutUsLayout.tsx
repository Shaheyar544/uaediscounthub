'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingDown, 
  Layers, 
  Bell, 
  MessageSquare, 
  Ticket, 
  Cpu, 
  ThumbsUp, 
  LineChart, 
  Search, 
  Zap, 
  Globe, 
  RefreshCw, 
  Shield, 
  Monitor, 
  Heart, 
  BookOpen, 
  Smartphone, 
  Sparkles, 
  Code, 
  Award,
  ChevronRight,
  ArrowRight
} from 'lucide-react'

interface AboutUsLayoutProps {
  locale: string
}

export default function AboutUsLayout({ locale }: AboutUsLayoutProps) {
  const isAr = locale === 'ar'
  const [activeCategory, setActiveCategory] = useState<'all' | 'compare' | 'ai' | 'speed' | 'ux'>('all')

  // Translations
  const t = {
    heroTitle: isAr ? 'مستقبل التسوق الذكي في الشرق الأوسط' : 'The Future of Intelligent Shopping in the Middle East',
    heroSub: isAr 
      ? 'نحن لسنا مجرد دليل أكواد خصم. UAEDiscountHub هو محرك مقارنة وتتبع مدعوم بالذكاء الاصطناعي لضمان أفضل الأسعار لحظياً.' 
      : 'We are not just another coupon list. UAEDiscountHub is a high-performance, AI-driven comparison engine engineered to ensure you never overpay again.',
    statsProducts: isAr ? 'منتج نشط' : 'Active Products',
    statsStores: isAr ? 'متاجر متكاملة' : 'Integrated Stores',
    statsSpeed: isAr ? 'سرعة التحميل' : 'Load Speed',
    statsHistory: isAr ? 'سجل تتبع الأسعار' : 'Price Tracking History',
    featuresTitle: isAr ? '٢٠ ميزة استثنائية تجعلنا الأفضل' : '20 Exceptional Features That Define Us',
    featuresSub: isAr
      ? 'اكتشف التقنيات والأدوات الذكية المصممة خصيصاً لتسهيل وتوفير تجربة التسوق الخاصة بك.'
      : 'Explore the advanced technologies and user-focused features built directly into our shopping ecosystem.',
    catAll: isAr ? 'الكل' : 'All Features',
    catCompare: isAr ? 'المقارنة والتتبع' : 'Comparison & Tracking',
    catAi: isAr ? 'الذكاء الاصطناعي' : 'AI Intelligence',
    catSpeed: isAr ? 'الأداء والسرعة' : 'Performance & Tech',
    catUx: isAr ? 'تجربة المستخدم' : 'User Experience',
    storyTitle: isAr ? 'قصتنا ورؤيتنا' : 'Our Story & Vision',
    storyP1: isAr
      ? 'تأسست المنصة في دبي عام ٢٠٢٤ بواسطة مهندسي برمجيات وعشاق تسوق سئموا من فتح عشرات التبويبات لمقارنة أسعار المنتجات الإلكترونية والتعرض للتضليل بالخصومات الوهمية.'
      : 'Founded in Dubai in 2024 by software developers and shopping enthusiasts, UAEDiscountHub was born out of frustration. We were tired of opening dozens of tabs to compare gadget prices and falling victim to fake markup discounts.',
    storyP2: isAr
      ? 'قمنا ببناء محرك مؤتمت يقوم بمسح الأسعار وتحديثها لحظياً، والتحقق من صلاحية الكوبونات، وتقديم رسوم بيانية حقيقية لأسعار السلع على مدار ٣٠ يوماً مضت.'
      : 'We built a proprietary engine that crawls stores in real time, verifies coupons, and generates actual 30-day pricing history graphs. We built the tool we wished existed, and now we share it with the entire GCC community.',
    techTitle: isAr ? 'بنيتنا التقنية الحديثة' : 'Our State-of-the-Art Tech Stack',
    techSub: isAr
      ? 'تتم معالجة وتوفير بياناتنا بسرعة فائقة بفضل أحدث التقنيات السحابية.'
      : 'We process millions of price updates securely and render them in milliseconds using cloud infrastructure.',
    ctaTitle: isAr ? 'ابدأ رحلة التوفير الذكي اليوم' : 'Start Shopping Smart Today',
    ctaSub: isAr
      ? 'ابحث عن منتجك المفضل الآن وقارن أسعاره عبر كبرى المتاجر في الإمارات.'
      : 'Search for your favorite gadgets now and witness the real-time comparison engine in action.',
    ctaBtn: isAr ? 'تصفح العروض الآن' : 'Explore active deals',
  }

  // Feature definitions
  const features = [
    {
      id: 1,
      category: 'compare',
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50',
      title: isAr ? 'مقارنة الأسعار لحظياً' : 'Real-Time Price Comparison',
      desc: isAr 
        ? 'يقوم النظام بمقارنة الأسعار بشكل مباشر وجنب إلى جنب عبر أمازون، نون، كارفور، وشرف دي جي.' 
        : 'Compare prices side-by-side across major GCC stores like Amazon AE, Noon, Carrefour, and Sharaf DG instantly.'
    },
    {
      id: 2,
      category: 'compare',
      icon: LineChart,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50',
      title: isAr ? 'مخطط تتبع الأسعار' : '30-Day Price History Graph',
      desc: isAr 
        ? 'رسومات بيانية تفاعلية توضح تذبذب أسعار المنتج على مدار الشهر الماضي لضمان الشراء بأرخص سعر.' 
        : 'View clear historical price charts plotting price changes to check if today\'s deal is a genuine low.'
    },
    {
      id: 3,
      category: 'ux',
      icon: Bell,
      color: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50',
      title: isAr ? 'تنبيهات انخفاض الأسعار' : 'Instant Price Drop Alerts',
      desc: isAr 
        ? 'حدد السعر المستهدف لمنتجك وسيقوم النظام بتنبيهك تلقائياً فور وصول السعر للقيمة المطلوبة.' 
        : 'Set a target budget for any item and get notified immediately the moment the price hits your target.'
    },
    {
      id: 4,
      category: 'ux',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/50',
      title: isAr ? 'إشعارات واتساب الفورية' : 'WhatsApp Price Alerts',
      desc: isAr 
        ? 'تكامل ذكي يرسل لك إشعاراً مباشراً على واتساب لتنبيهك بصفقات الفلاش قصيرة المدى.' 
        : 'Receive immediate alerts about flash deals and price drops on your preferred messaging platform.'
    },
    {
      id: 5,
      category: 'compare',
      icon: Ticket,
      color: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50',
      title: isAr ? 'كوبونات خصم موثوقة' : 'Verified Coupon Engine',
      desc: isAr 
        ? 'نقوم بفحص وتحديث أكواد الخصم يومياً للتخلص من الكوبونات المنتهية والصحفية.' 
        : 'Hourly verification system that removes expired promotions, delivering only 100% active coupon codes.'
    },
    {
      id: 6,
      category: 'ai',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/50',
      title: isAr ? 'ملخصات بالذكاء الاصطناعي' : 'AI Product Summaries',
      desc: isAr 
        ? 'قراءة سريعة وموجزة لمواصفات المنتجات ومميزاتها الرئيسية باستخدام نماذج لغوية متقدمة.' 
        : 'Get quick, distilled digests of complex technical specifications utilizing advanced generative AI models.'
    },
    {
      id: 7,
      category: 'ai',
      icon: ThumbsUp,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50',
      title: isAr ? 'استخلاص المزايا والعيوب' : 'AI Pros & Cons Extraction',
      desc: isAr 
        ? 'تحليل آلاف المراجعات الحقيقية للمستخدمين وصياغتها في نقاط إيجابية وسلبية واضحة.' 
        : 'Distills hundreds of user reviews into straightforward pros and cons lists, helping you decide in seconds.'
    },
    {
      id: 8,
      category: 'ai',
      icon: Sparkles,
      color: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-950/30 dark:border-pink-900/50',
      title: isAr ? 'التنبؤ الذكي بالأسعار' : 'AI Price Prediction',
      desc: isAr 
        ? 'يقوم الذكاء الاصطناعي بتحليل الاتجاهات وتقديم نصيحة للشراء الفوري أو الانتظار.' 
        : 'Smart analysis that evaluates pricing cycles to advise you whether to buy immediately or wait.'
    },
    {
      id: 9,
      category: 'ux',
      icon: Search,
      color: 'text-sky-600 bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/50',
      title: isAr ? 'البحث الذكي السريع' : 'Autocomplete Smart Search',
      desc: isAr 
        ? 'شريط بحث ديناميكي يعرض نتائج فورية أثناء الكتابة مقسمة حسب الفئات والماركات.' 
        : 'A highly optimized search bar showing instant matching results across brands, models, and stores.'
    },
    {
      id: 10,
      category: 'ux',
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900/50',
      title: isAr ? 'النسخ والانتقال السريع' : 'One-Click Copy & Go',
      desc: isAr 
        ? 'نسخ كود الخصم بلمسة واحدة وفتح المتجر تلقائياً في علامة تبويب جديدة لتوفير الوقت.' 
        : 'Copies the code to your clipboard and opens the retail store checkout in one seamless click.'
    },
    {
      id: 11,
      category: 'speed',
      icon: Globe,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100 dark:bg-cyan-950/30 dark:border-cyan-900/50',
      title: isAr ? 'دعم كامل للغتين' : 'Bilingual Engine (EN/AR)',
      desc: isAr 
        ? 'تمت مواءمة محتوى الموقع بالكامل وقاعدة البيانات للعمل باللغتين العربية والإنجليزية.' 
        : 'Every piece of data, product spec, and blog article runs natively in both English and Arabic.'
    },
    {
      id: 12,
      category: 'speed',
      icon: Monitor,
      color: 'text-teal-600 bg-teal-50 border-teal-100 dark:bg-teal-950/30 dark:border-teal-900/50',
      title: isAr ? 'تصميم متوافق مع RTL' : 'Optimized RTL Layout',
      desc: isAr 
        ? 'تصميم واجهة مستخدم متكامل مخصص لاتجاه الكتابة العربي لضمان قراءة مريحة وطبيعية.' 
        : 'A beautiful right-to-left layout alignment designed specifically for native Arabic speakers.'
    },
    {
      id: 13,
      category: 'speed',
      icon: Code,
      color: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-950/30 dark:border-slate-900/50',
      title: isAr ? 'إضافة متصفح ذكية للمشرفين' : 'Chrome Extension Scraper',
      desc: isAr 
        ? 'أداة كروم مخصصة للمشرفين لاستيراد صفقات المتاجر وتحديث الأسعار بنقرة واحدة.' 
        : 'A proprietary browser extension that allows admins to sync and upload deals on the fly.'
    },
    {
      id: 14,
      category: 'speed',
      icon: RefreshCw,
      color: 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50',
      title: isAr ? 'أداء وتجاوب فائق السرعة' : 'Next.js 15 App Router',
      desc: isAr 
        ? 'بناء على أحدث معمارية للويب لتوفير سرعة استجابة مذهلة وتوفير بيانات المستخدمين.' 
        : 'Built using server-side rendering boundaries to achieve sub-second page loads.'
    },
    {
      id: 15,
      category: 'speed',
      icon: Zap,
      color: 'text-blue-700 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50',
      title: isAr ? 'تحديث البيانات الذكي (ISR)' : 'Incremental Static Revalidation',
      desc: isAr 
        ? 'تحميل فوري للصفحات مع تحديث الأسعار بالخلفية لضمان دقة البيانات دون إبطاء الموقع.' 
        : 'Combines static page rendering speed with automatic background data updates.'
    },
    {
      id: 16,
      category: 'speed',
      icon: Shield,
      color: 'text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/50',
      title: isAr ? 'حماية وأمن كاملين' : 'Hardened RLS Security',
      desc: isAr 
        ? 'بنية أمنية قائمة على قيود مستوى الصف في قاعدة البيانات لحماية إعدادات ومستخدمي المنصة.' 
        : 'Bypasses standard client-side writes by securing all mutations via database row-level filters.'
    },
    {
      id: 17,
      category: 'ux',
      icon: Smartphone,
      color: 'text-lime-600 bg-lime-50 border-lime-100 dark:bg-lime-950/30 dark:border-lime-900/50',
      title: isAr ? 'واجهة مخصصة للهواتف' : 'Mobile-First Layouts',
      desc: isAr 
        ? 'تصميم زجاجي عصري متجاوب بنسبة ١٠٠٪ مع شاشات الهواتف والتابلت.' 
        : 'Premium glassmorphic layouts styled primarily for responsive mobile browser usage.'
    },
    {
      id: 18,
      category: 'ux',
      icon: Heart,
      color: 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/50',
      title: isAr ? 'لوحة تتبع الأمنيات' : 'Personalized Wishlists',
      desc: isAr 
        ? 'إمكانية حفظ المنتجات المفضلة ومراقبة هبوط أسعارها بشكل جماعي.' 
        : 'Save target items to a personal watchlist space and trace their prices collectively.'
    },
    {
      id: 19,
      category: 'ux',
      icon: BookOpen,
      color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-950/30 dark:border-fuchsia-900/50',
      title: isAr ? 'مدونة تسوق غنية' : 'Bilingual CMS Blog System',
      desc: isAr 
        ? 'مقالات ومراجعات شراء تفصيلية بأقلام خبراء لمساعدتك على التسوق والتوفير بذكاء.' 
        : 'Rich editorial articles, product reviews, and discount codes written by industry professionals.'
    },
    {
      id: 20,
      category: 'compare',
      icon: Award,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50',
      title: isAr ? 'الاستهداف الإقليمي الديناميكي' : 'Regional GCC Auto-targeting',
      desc: isAr 
        ? 'تخصيص كامل للعملة والمتاجر المتاحة تلقائياً لتناسب بلد إقامتك (الإمارات، السعودية).' 
        : 'Automatically maps local store prices and default currencies depending on regional target switches.'
    }
  ]

  const filteredFeatures = activeCategory === 'all' 
    ? features 
    : features.filter(f => f.category === activeCategory)

  return (
    <div className="w-full bg-[#F6F8FC] dark:bg-[#0D1117] transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0057FF] to-[#002B99] py-20 px-6 sm:px-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/90 border border-white/10 mb-6">
              <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              {isAr ? 'منصة ذكية متكاملة' : 'Next-Gen Platform'}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto"
          >
            {t.heroTitle}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-white/80 max-w-3xl mx-auto font-light leading-relaxed"
          >
            {t.heroSub}
          </motion.p>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-[#161B22] rounded-2xl border border-[#DDE3EF] dark:border-gray-800 shadow-xl">
          {[
            { value: '10+', label: t.statsStores },
            { value: '60+', label: t.statsProducts },
            { value: '1.2s', label: t.statsSpeed },
            { value: '30-Day', label: t.statsHistory }
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#0057FF]">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 20 FEATURES SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D1117] dark:text-white leading-tight">
            {t.featuresTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto text-[15px]">
            {t.featuresSub}
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: 'all', label: t.catAll },
            { id: 'compare', label: t.catCompare },
            { id: 'ai', label: t.catAi },
            { id: 'speed', label: t.catSpeed },
            { id: 'ux', label: t.catUx }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${
                activeCategory === cat.id
                  ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-[#161B22] text-gray-600 dark:text-gray-300 border-[#DDE3EF] dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredFeatures.map((feat) => {
            const IconComponent = feat.icon
            return (
              <motion.div
                layout
                key={feat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group p-6 bg-white dark:bg-[#161B22] rounded-2xl border border-[#DDE3EF] dark:border-gray-800/80 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#0057FF]/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 transition-transform duration-300 group-hover:scale-110 ${feat.color}`}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D1117] dark:text-white mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F6F8FC] dark:border-gray-800/50 flex justify-between items-center text-xs font-semibold text-gray-400 dark:text-gray-500">
                  <span className="uppercase tracking-wider">Feature #{feat.id.toString().padStart(2, '0')}</span>
                  <span className="capitalize">{feat.category}</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* STORY SECTION */}
      <section className="bg-white dark:bg-[#161B22] border-y border-[#DDE3EF] dark:border-gray-800 py-20 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0057FF] bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
              {isAr ? 'من نحن' : 'Our Roots'}
            </span>
            <h2 className="text-3xl font-extrabold text-[#0D1117] dark:text-white mt-4">
              {t.storyTitle}
            </h2>
          </div>
          <div className="space-y-6 text-[#4B5675] dark:text-gray-300 text-base sm:text-lg leading-relaxed font-light text-center">
            <p>{t.storyP1}</p>
            <p>{t.storyP2}</p>
          </div>
        </div>
      </section>

      {/* TECH STACK VISUAL SHOWCASE */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D1117] dark:text-white">
            {t.techTitle}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-[14px]">
            {t.techSub}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Next.js 15', desc: 'Server Actions & ISR', icon: RefreshCw },
            { name: 'Tailwind v4', desc: 'CSS Variables Theme', icon: Zap },
            { name: 'Supabase', desc: 'Auth, Postgres, Realtime', icon: Shield },
            { name: 'Cloudflare R2', desc: 'Optimized Image Host', icon: Globe },
            { name: 'Amazon API', desc: 'OAuth Bearer Sync', icon: Cpu }
          ].map((tech, idx) => {
            const TechIcon = tech.icon
            return (
              <div key={idx} className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#DDE3EF] dark:border-gray-800 text-center flex flex-col items-center shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 mb-3 border border-gray-100 dark:border-gray-700">
                  <TechIcon size={20} />
                </div>
                <div className="font-bold text-sm text-[#0D1117] dark:text-white">{tech.name}</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-snug">{tech.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-br from-[#0057FF] to-[#0047dd] py-16 px-6 sm:px-12 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">{t.ctaTitle}</h2>
          <p className="mt-4 text-white/80 text-base sm:text-lg font-light leading-relaxed">{t.ctaSub}</p>
          <div className="mt-8 flex justify-center">
            <a 
              href={`/${locale}/search?q=phone`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0057FF] font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {t.ctaBtn}
              {isAr ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
