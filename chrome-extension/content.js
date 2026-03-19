// ─── UAEDiscountHub Product Importer — Content Script ────────────────────────
// Runs on: amazon.ae, noon.com, sharafdg.com, carrefouruae.com

'use strict';

// ── FIX 2: Category mapping ───────────────────────────────────────────────────

const CATEGORY_MAP = {
  'iphone':       'Smartphones',
  'samsung galaxy': 'Smartphones',
  'smartphone':   'Smartphones',
  'mobile phone': 'Smartphones',
  'phone':        'Smartphones',
  'macbook':      'Laptops',
  'laptop':       'Laptops',
  'notebook':     'Laptops',
  'chromebook':   'Laptops',
  'ipad':         'Tablets',
  'tablet':       'Tablets',
  'airpods':      'TV & Audio',
  'headphone':    'TV & Audio',
  'earphone':     'TV & Audio',
  'earbuds':      'TV & Audio',
  'speaker':      'TV & Audio',
  'soundbar':     'TV & Audio',
  'television':   'TV & Audio',
  ' tv ':         'TV & Audio',
  'smart tv':     'TV & Audio',
  'monitor':      'Monitors',
  'playstation':  'Gaming',
  'xbox':         'Gaming',
  'nintendo':     'Gaming',
  'gaming':       'Gaming',
  'smartwatch':   'Watches',
  'watch':        'Watches',
  'refrigerator': 'Appliances',
  'washing machine': 'Appliances',
  'dishwasher':   'Appliances',
  'microwave':    'Appliances',
  'air conditioner': 'Appliances',
  'camera':       'Cameras',
  'dslr':         'Cameras',
  'mirrorless':   'Cameras',
  'printer':      'Printers',
  'router':       'Networking',
  'wifi':         'Networking',
};

function detectCategory(name, breadcrumb) {
  const text = (name + ' ' + breadcrumb).toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return category;
  }
  return null;
}

// ── FIX 6: Tag generator ──────────────────────────────────────────────────────

const STOP_WORDS = new Set(['with', 'and', 'the', 'for', 'inch', 'new', 'gen',
  'pro', 'max', 'plus', 'ultra', 'series', 'edition', 'pack', 'set', 'kit',
  'official', 'original', 'genuine', 'bundle', 'compatible']);

function generateTags(name, brand, category) {
  const words = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  return [...new Set([
    brand?.toLowerCase().trim(),
    category?.toLowerCase().trim(),
    ...words.slice(0, 8),
  ])].filter(Boolean);
}

// ── FIX 1: Coupon code scraper ───────────────────────────────────────────────

function scrapeCouponCode() {
  // Collect all text from promotion/coupon elements
  const savingsText = Array.from(document.querySelectorAll(
    '#promoPriceBlockMessage_feature_div span,' +
    '#couponBadgeRegularVpc span,' +
    '.reinventPriceSavingsPercentageMargin,' +
    '#vpcButton span,' +
    '.a-color-success'
  )).map(el => el.textContent.trim()).join(' ');

  // Method 1: "Enter code XXXXX" pattern in collected text
  let codeMatch = savingsText.match(/[Ee]nter\s+code\s+([A-Z0-9]{4,12})/);

  // Method 2: Scan raw HTML (catches codes in hidden/JS-rendered nodes)
  if (!codeMatch) {
    codeMatch = document.body.innerHTML.match(/[Ee]nter\s+code\s+([A-Z0-9]{4,12})/);
  }

  // Method 3: Clip coupon badge (e.g. "Clip coupon — save 10%")
  const clipText = document.querySelector(
    '#couponBadge, .couponBadge, [data-csa-c-type="coupon"]'
  )?.textContent || '';
  const clipCode = clipText.match(/\b([A-Z0-9]{4,12})\b/)?.[1] || null;

  const coupon_code = codeMatch?.[1] || clipCode || null;

  // Extract discount description: "10% max AED 50" style
  const fullText = savingsText + ' ' + clipText;
  const coupon_discount = fullText.match(/(\d+%[^|.\n]{0,40})/)?.[1]?.trim() || null;

  return { coupon_code, coupon_discount };
}

// ── FIX 2: Meta description generator ────────────────────────────────────────

function generateMetaDescription(name, bullets, price) {
  const features = (bullets || [])
    .slice(0, 2)
    .join('. ')
    .substring(0, 100);

  const priceText = price ? `From AED ${price}.` : '';

  return (`${name}. ${features} ${priceText} Best price in UAE. Compare prices across Amazon, Noon, Sharaf DG and more.`)
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160);
}

// ── FIX 7: Description cleaner ────────────────────────────────────────────────

function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')   // strip non-ASCII
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 2000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() || '';
}

function attr(selector, attribute, root = document) {
  return root.querySelector(selector)?.getAttribute(attribute)?.trim() || '';
}

function cleanPrice(raw) {
  if (!raw) return '';
  return raw.replace(/[^\d.]/g, '').trim();
}

// ── FIX 1: Slug generator (6-word max) ───────────────────────────────────────

function generateSlug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .join('-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── FIX 3: Amazon product image scraper ──────────────────────────────────────

function getAmazonImages() {
  const seen = new Set();
  const results = [];

  // Primary: left thumbnail strip (most reliable — only actual product shots)
  document.querySelectorAll(
    '#altImages li.item img, #altImages .a-button-thumbnail img'
  ).forEach(img => {
    let src = img.src || img.dataset.src || '';
    // Upgrade to 1500px version
    src = src.replace(/\._[A-Z0-9_,]+_\./, '._SL1500_.');
    src = src.split('?')[0];
    if (
      src &&
      src.includes('amazon') &&
      src.match(/\.(jpg|jpeg|png|webp)/i) &&
      !src.includes('play-button') &&
      !src.includes('video') &&
      !src.includes('transparent-pixel') &&
      !seen.has(src)
    ) {
      seen.add(src);
      results.push(src);
    }
  });

  // Fallback: hero image data-a-dynamic-image JSON
  if (results.length === 0) {
    try {
      const heroEl = document.querySelector('#landingImage, #imgTagWrapperId img');
      if (heroEl) {
        const dynJson = heroEl.getAttribute('data-a-dynamic-image');
        if (dynJson) {
          // Keys are URLs, values are [width, height] — pick largest
          const parsed = JSON.parse(dynJson);
          const sorted = Object.entries(parsed).sort((a, b) => b[1][0] - a[1][0]);
          sorted.forEach(([url]) => {
            const clean = url.split('?')[0];
            if (!seen.has(clean)) { seen.add(clean); results.push(clean); }
          });
        } else if (heroEl.src) {
          const clean = heroEl.src
            .replace(/\._[A-Z0-9_,]+_\./, '._SL1500_.')
            .split('?')[0];
          if (!seen.has(clean)) results.push(clean);
        }
      }
    } catch (_) {}
  }

  return results.slice(0, 8);
}

// ── FIX 5: Amazon spec scraper ────────────────────────────────────────────────

function scrapeAmazonSpecs() {
  const specs = {};

  // Method 1: Tech specs table (th/td)
  document.querySelectorAll(
    '#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr'
  ).forEach(row => {
    const key = row.querySelector('th')?.textContent?.trim();
    const val = row.querySelector('td')?.textContent?.trim()
      ?.replace(/\u200e/g, '')   // strip LTR mark
      ?.replace(/\s+/g, ' ');
    if (key && val && key.length < 80) specs[key] = val;
  });

  // Method 2: Detail bullets wrapper
  document.querySelectorAll(
    '#detailBulletsWrapper_feature_div li, #productDetails_detailBullets_sections1 li'
  ).forEach(li => {
    const raw = li.textContent.trim().replace(/\u200e/g, '');
    const colonIdx = raw.indexOf(':');
    if (colonIdx > 0) {
      const key = raw.substring(0, colonIdx).trim();
      const val = raw.substring(colonIdx + 1).trim();
      if (key && val && key.length < 80) specs[key] = val;
    }
  });

  // Method 3: Product overview / comparison grid
  document.querySelectorAll('.po-section-grid .a-row, .po-attribute').forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length >= 2) {
      const key = spans[0].textContent.trim();
      const val = spans[1].textContent.trim();
      if (key && val && key.length < 80 && !specs[key]) specs[key] = val;
    }
  });

  return specs;
}

// ── Amazon.ae Scraper ─────────────────────────────────────────────────────────

function scrapeAmazon() {
  const asin = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';

  // FIX 4: Price — whole + fraction
  const priceWhole    = text('.a-price-whole').replace(/[^\d]/g, '');
  const priceFraction = text('.a-price-fraction').replace(/[^\d]/g, '') || '00';
  const rawPrice = priceWhole
    ? `${priceWhole}.${priceFraction}`
    : cleanPrice(text('.a-offscreen'));

  // FIX 4: Original / strike-through price
  const rawOriginal =
    cleanPrice(text('.basisPrice .a-offscreen')) ||
    cleanPrice(text('span.a-text-price .a-offscreen')) ||
    cleanPrice(text('.a-text-strike')) ||
    '';

  // Brand
  const brand =
    text('#bylineInfo')
      .replace(/^(Visit the|Brand:|Store:)/i, '')
      .replace(/Store$/, '')
      .trim() ||
    text('.po-brand .po-break-word');

  // FIX 3: Images from thumbnail strip only
  const images = getAmazonImages();
  const thumbnail_url = images[0] || '';

  // Bullet points
  const bullet_points = Array.from(
    document.querySelectorAll('#feature-bullets ul li span.a-list-item')
  ).map(el => el.textContent.trim())
   .filter(t => t.length > 5 && !t.startsWith('›') && !t.startsWith('Make sure'));

  // FIX 5: Specs
  const specs = scrapeAmazonSpecs();

  // Breadcrumb category
  const breadcrumb = text('#wayfinding-breadcrumbs_feature_div a:last-child');

  // FIX 2: Smart category detection
  const name = text('#productTitle');
  const category = detectCategory(name, breadcrumb) || breadcrumb || '';

  // Rating
  const ratingTitle = attr('#acrPopover', 'title');
  const rating      = ratingTitle.match(/([\d.]+) out of/)?.[1] || '';
  const rating_count = text('#acrCustomerReviewText').replace(/[^0-9]/g, '');

  // FIX 7: Cleaned description
  const rawDesc = text('#productDescription p') ||
                  bullet_points.slice(0, 5).join('\n');
  const description = cleanDescription(rawDesc);

  // FIX 6: Tags
  const tags = generateTags(name, brand, category);

  // FIX 1 (prev session): Short slug
  const slug = generateSlug(name);

  // FIX 1 (this session): Coupon code
  const { coupon_code, coupon_discount } = scrapeCouponCode();

  // FIX 2: Auto meta description
  const meta_description = generateMetaDescription(name, bullet_points, rawPrice);

  // FIX 3: Additional fields
  const availability     = text('#availability span').replace(/\s+/g, ' ') || null;
  const delivery         = text('#mir-layout-DELIVERY_BLOCK span[data-csa-c-type]') || null;
  const reviews_count    = text('#acrCustomerReviewText').replace(/[^0-9]/g, '') || null;
  const is_amazon_choice = !!document.querySelector('.ac-badge-wrapper, #acBadge_feature_div');

  return {
    source_store:     'Amazon UAE',
    source_url:       window.location.href,
    asin,
    name,
    slug,
    brand,
    category,
    price:            rawPrice,
    original_price:   rawOriginal || null,
    currency:         'AED',
    rating,
    rating_count,
    reviews_count,
    images,
    thumbnail_url,
    description,
    bullet_points,
    specs,
    tags,
    coupon_code,
    coupon_discount,
    meta_description,
    availability,
    delivery,
    is_amazon_choice,
    store:            'Amazon UAE',
    affiliate_url:    window.location.href,
    status:           'draft',
  };
}

// ── Noon.com Scraper ──────────────────────────────────────────────────────────

function scrapeNoon() {
  const rawPrice    = cleanPrice(text('[class*="priceNow"], [class*="price-now"], .price'));
  const rawOriginal = cleanPrice(text('[class*="priceWas"], [class*="price-was"], .was-price'));

  const images = [...new Set(
    Array.from(document.querySelectorAll(
      '[class*="imageGallery"] img, [class*="image-gallery"] img, .product-image img'
    ))
    .map(img => (img.src || img.dataset.src || '').split('?')[0])
    .filter(src => src.match(/\.(jpg|png|webp)/i))
  )].slice(0, 8);

  const specs = {};
  document.querySelectorAll('[class*="specRow"], [class*="spec-row"], .product-spec tr').forEach(row => {
    const cells = row.querySelectorAll('td, [class*="label"], [class*="value"]');
    if (cells.length >= 2) {
      const k = cells[0].textContent.trim();
      const v = cells[1].textContent.trim();
      if (k && v) specs[k] = v;
    }
  });

  const name      = text('h1[class*="name"], h1[class*="title"], h1.product-name');
  const brand     = text('[class*="brandName"], [class*="brand-name"], .brand a');
  const breadcrumb = text('[class*="breadcrumb"] a:last-child, .breadcrumb a:last-child');
  const category  = detectCategory(name, breadcrumb) || breadcrumb;
  const tags      = generateTags(name, brand, category);
  const slug      = generateSlug(name);

  return {
    source_store:   'Noon',
    source_url:     window.location.href,
    name,
    slug,
    brand,
    category,
    price:          rawPrice,
    original_price: rawOriginal || null,
    currency:       'AED',
    images,
    thumbnail_url:  images[0] || '',
    description:    cleanDescription(text('[class*="productDescription"], [class*="product-description"]')),
    specs,
    tags,
    store:          'Noon',
    affiliate_url:  window.location.href,
    status:         'draft',
  };
}

// ── SharafDG Scraper ──────────────────────────────────────────────────────────

function scrapeSharafDG() {
  const rawPrice    = cleanPrice(text('.product-info-price .price, [data-price-amount]'));
  const rawOriginal = cleanPrice(text('.old-price .price, del .price'));

  const images = [...new Set(
    Array.from(document.querySelectorAll(
      '.MagicSlideshow img, .gallery-image img, .product-image-photo'
    ))
    .map(img => (img.src || img.dataset.src || '').split('?')[0])
    .filter(src => src.match(/\.(jpg|png|webp)/i))
  )].slice(0, 8);

  const specs = {};
  document.querySelectorAll('.product.attribute, .additional-attributes tr').forEach(row => {
    const label = text('.attribute-label, th', row);
    const value = text('.attribute-value, td', row);
    if (label && value) specs[label] = value;
  });

  const name      = text('.page-title h1, [itemprop="name"]');
  const brand     = text('.product-brand-name, [itemprop="brand"]');
  const breadcrumb = text('.breadcrumbs li:last-child a, .breadcrumb li:last-child a');
  const category  = detectCategory(name, breadcrumb) || breadcrumb;
  const tags      = generateTags(name, brand, category);
  const slug      = generateSlug(name);

  return {
    source_store:   'SharafDG',
    source_url:     window.location.href,
    name,
    slug,
    brand,
    category,
    price:          rawPrice,
    original_price: rawOriginal || null,
    currency:       'AED',
    images,
    thumbnail_url:  images[0] || '',
    description:    cleanDescription(text('[itemprop="description"], .product.attribute.description .value')),
    specs,
    tags,
    store:          'SharafDG',
    affiliate_url:  window.location.href,
    status:         'draft',
  };
}

// ── Carrefour UAE Scraper ─────────────────────────────────────────────────────

function scrapeCarrefour() {
  const rawPrice    = cleanPrice(text('.css-17ctnp, [class*="product-price"] .value, .price__selling'));
  const rawOriginal = cleanPrice(text('[class*="price__was"], .price__old, del'));

  const images = [...new Set(
    Array.from(document.querySelectorAll(
      '[class*="product-image"] img, .pdp-image img, [class*="gallery"] img'
    ))
    .map(img => (img.src || img.dataset.src || '').split('?')[0])
    .filter(src => src.match(/\.(jpg|png|webp)/i))
  )].slice(0, 8);

  const specs = {};
  document.querySelectorAll(
    '[class*="specification"] li, .product-specs tr, [class*="feature-item"]'
  ).forEach(row => {
    const label = text('[class*="label"], td:first-child, dt', row);
    const value = text('[class*="value"], td:last-child, dd', row);
    if (label && value && label !== value) specs[label] = value;
  });

  const name      = text('h1[class*="title"], h1[class*="name"], .pdp-name');
  const brand     = text('[class*="brand"] a, [class*="brand-name"]');
  const breadcrumb = text('[class*="breadcrumb"] li:last-child a, nav[aria-label*="breadcrumb"] li:last-child');
  const category  = detectCategory(name, breadcrumb) || breadcrumb;
  const tags      = generateTags(name, brand, category);
  const slug      = generateSlug(name);

  return {
    source_store:   'Carrefour UAE',
    source_url:     window.location.href,
    name,
    slug,
    brand,
    category,
    price:          rawPrice,
    original_price: rawOriginal || null,
    currency:       'AED',
    images,
    thumbnail_url:  images[0] || '',
    description:    cleanDescription(text('[class*="description"] p, .description-container p')),
    specs,
    tags,
    store:          'Carrefour UAE',
    affiliate_url:  window.location.href,
    status:         'draft',
  };
}

// ── Amazon Deals Page Scraper ─────────────────────────────────────────────────

const AFFILIATE_TAG = 'uaediscounthub-21'

function isAmazonDealsPage() {
  const path = window.location.pathname;
  return path.startsWith('/deals') || path.includes('/b/') && window.location.search.includes('deals');
}

function parseAmazonPrice(el) {
  if (!el) return null;
  const whole = el.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
  const frac  = el.querySelector('.a-price-fraction')?.textContent?.replace(/[^\d]/g, '') || '00';
  if (whole) return parseFloat(`${whole}.${frac}`);
  const offscreen = el.querySelector('.a-offscreen')?.textContent?.replace(/[^\d.]/g, '');
  return offscreen ? parseFloat(offscreen) : null;
}

function scrapeAmazonDealsPage() {
  const deals = [];

  // Deal cards container — Amazon uses several layouts depending on page variant
  const cardSelectors = [
    '[data-testid="deal-card"]',
    '.dealCard',
    '[class*="DealCard"]',
    '[data-component-type="s-deal-card"]',
    '.a-section.octopus-dlp-asin-section',
    '.octopus-pc-item',
    '[class*="GridCard"]',
    '.s-asin',
  ];

  let cards = [];
  for (const sel of cardSelectors) {
    cards = Array.from(document.querySelectorAll(sel));
    if (cards.length > 0) break;
  }

  // Fallback: collect any element that has an ASIN and a price
  if (cards.length === 0) {
    cards = Array.from(document.querySelectorAll('[data-asin]')).filter(el => {
      return el.querySelector('.a-price, [class*="price"]');
    });
  }

  for (const card of cards.slice(0, 50)) {
    try {
      // ASIN
      const asin =
        card.dataset.asin ||
        card.getAttribute('data-asin') ||
        card.querySelector('[data-asin]')?.dataset.asin ||
        card.querySelector('a[href*="/dp/"]')?.href?.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ||
        '';

      if (!asin || asin.length !== 10) continue;

      // Title
      const title =
        card.querySelector('[data-testid="deal-title"], .a-truncate-full, .a-size-base-plus, [class*="title"]')?.textContent?.trim() ||
        card.querySelector('a[href*="/dp/"]')?.title ||
        card.querySelector('img')?.alt ||
        '';

      if (!title) continue;

      // Image
      const img = card.querySelector('img');
      let image_url = img?.src || img?.dataset.src || '';
      if (image_url) {
        image_url = image_url.replace(/\._[A-Z0-9_,]+_\./, '._SL500_.').split('?')[0];
      }

      // Prices
      const priceEl     = card.querySelector('.a-price:not(.a-text-price)');
      const origPriceEl = card.querySelector('.a-text-price, .a-price.a-text-price');

      const current_price  = parseAmazonPrice(priceEl);
      const original_price = parseAmazonPrice(origPriceEl);

      if (!current_price) continue;

      // Discount percent — from badge or calculated
      let discount_percent: number | null = null;
      const badgeText =
        card.querySelector('[class*="badge"], [class*="discount"], .a-badge-text')?.textContent || '';
      const badgeMatch = badgeText.match(/(\d+)\s*%/);
      if (badgeMatch) {
        discount_percent = parseInt(badgeMatch[1], 10);
      } else if (original_price && original_price > current_price) {
        discount_percent = Math.round(((original_price - current_price) / original_price) * 100);
      }

      // Coupon
      let coupon_value: string | null = null;
      let coupon_type: 'percentage' | 'fixed' | null = null;
      const couponEl = card.querySelector('[id*="coupon"], [class*="coupon"], .couponBadge');
      if (couponEl) {
        const ct = couponEl.textContent.trim();
        const pctMatch = ct.match(/(\d+)\s*%/);
        const aedMatch = ct.match(/AED\s*([\d.]+)/i);
        if (pctMatch) { coupon_value = `${pctMatch[1]}%`; coupon_type = 'percentage'; }
        else if (aedMatch) { coupon_value = `AED ${aedMatch[1]}`; coupon_type = 'fixed'; }
      }

      // Lightning deal / badge
      const is_lightning = !!(
        card.querySelector('[class*="lightning"], [id*="lightning"]') ||
        card.textContent.includes('Lightning Deal')
      );
      const badge = badgeText.trim() || null;

      // Rating
      const ratingText = card.querySelector('.a-icon-star-small, [class*="rating"]')?.textContent || '';
      const rating = ratingText.match(/([\d.]+)/)?.[1] || null;
      const rating_count = card.querySelector('[class*="review"]')?.textContent?.replace(/[^\d]/g, '') || null;

      // Affiliate URL
      const productPath = `/dp/${asin}`;
      const affiliate_url = `https://www.amazon.ae${productPath}?tag=${AFFILIATE_TAG}`;

      // Expiry (lightning deals show countdown)
      let expires_at: string | null = null;
      const countdownEl = card.querySelector('[class*="countdown"], [class*="timer"], [id*="timer"]');
      if (countdownEl) {
        // Just mark it as expiring soon — we don't have an absolute time from the DOM
        const future = new Date();
        future.setHours(future.getHours() + 6);
        expires_at = future.toISOString();
      }

      deals.push({
        asin,
        title,
        image_url,
        current_price,
        original_price,
        discount_percent,
        coupon_value,
        coupon_type,
        affiliate_url,
        expires_at,
        is_lightning,
        badge,
        rating,
        rating_count,
      });
    } catch (_) {
      // skip malformed card
    }
  }

  return deals;
}

// ── Store Detection & Dispatch ────────────────────────────────────────────────

function detectStore() {
  const host = window.location.hostname;
  if (host.includes('amazon.ae'))        return 'amazon';
  if (host.includes('noon.com'))         return 'noon';
  if (host.includes('sharafdg.com'))     return 'sharafdg';
  if (host.includes('carrefouruae.com')) return 'carrefour';
  return null;
}

function scrapeCurrentPage() {
  const store = detectStore();
  switch (store) {
    case 'amazon':    return scrapeAmazon();
    case 'noon':      return scrapeNoon();
    case 'sharafdg':  return scrapeSharafDG();
    case 'carrefour': return scrapeCarrefour();
    default:
      return { error: 'Store not supported. Open a product page on Amazon.ae, Noon, SharafDG, or Carrefour UAE.' };
  }
}

// ── Message Listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'scrape') {
    try {
      const data = scrapeCurrentPage();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  if (request.action === 'scrapeDeals') {
    try {
      const deals = scrapeAmazonDealsPage();
      sendResponse({ success: true, deals });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  if (request.action === 'ping') {
    sendResponse({ success: true, store: detectStore(), isDealsPage: isAmazonDealsPage() });
  }
  return true;
});
