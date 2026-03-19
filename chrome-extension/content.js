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
  const AFFILIATE_TAG = 'uaediscount-21';
  const deals = [];

  const cards = document.querySelectorAll(
    'div[data-testid="product-card"][data-asin]'
  );

  console.log(`Found ${cards.length} deal cards`);

  cards.forEach(card => {
    try {
      // ASIN
      const asin = card.getAttribute('data-asin');
      if (!asin) return;

      // Product title (full untruncated)
      const name = card.querySelector(
        '.a-truncate-full.a-offscreen'
      )?.textContent?.trim();
      if (!name) return;

      // Coupon badge — "Save 15%" or "Save AED 50"
      const couponRaw = card.querySelector(
        'span.CouponExperienceBadge-module__label_Qzf0b6DKge1SbAxIoQeY'
      )?.textContent?.trim();

      // Limited time deal badge — "20% off"
      const limitedDealBadge = card.querySelector(
        '.style_couponBadgeLabelOnyxText__f1Itu'
      )?.textContent?.trim();

      // Current deal price — "Price: AED 708.96" or "Deal Price: AED 217.22"
      const priceRaw = card.querySelector(
        '.ProductCard-module__priceToPay_olAgJzVNGyj2javg2pAe .a-offscreen'
      )?.textContent?.trim();

      // Original price — "Was: AED 798.97" or "List: AED 599.00"
      const originalRaw = card.querySelector(
        '.ProductCard-module__wrapPrice__sMO92NjAjHmGPn3jnIH .a-offscreen'
      )?.textContent?.trim();

      // High quality image (2x from srcset)
      const imgEl = card.querySelector('img.a-amazon-image');
      const srcset = imgEl?.getAttribute('srcset') || '';
      const imgUrl = srcset.includes('2x')
        ? srcset.split(',').find(s => s.includes('2x'))?.trim()?.split(' ')?.[0]
        : imgEl?.src;

      // Product URL with affiliate tag
      const rawHref = card.querySelector(
        'a[data-testid="product-card-link"]'
      )?.getAttribute('href');
      const cleanPath = rawHref?.split('?')?.[0];
      const affiliateUrl = cleanPath
        ? `https://www.amazon.ae${cleanPath}?tag=${AFFILIATE_TAG}`
        : null;

      // Parse prices
      const dealPrice     = parseFloat(priceRaw?.replace(/[^0-9.]/g, '') || '0');
      const originalPrice = parseFloat(originalRaw?.replace(/[^0-9.]/g, '') || '0');

      // Parse coupon
      let couponType  = null;
      let couponValue = null;
      const couponText = couponRaw || limitedDealBadge;

      if (couponRaw) {
        const percentMatch = couponRaw.match(/(\d+)%/);
        const amountMatch  = couponRaw.match(/AED[\s\u00a0]*(\d+)/i);
        if (percentMatch)     { couponType = 'percentage'; couponValue = parseInt(percentMatch[1]); }
        else if (amountMatch) { couponType = 'amount';     couponValue = parseInt(amountMatch[1]); }
      }

      // Limited time deal discount percent
      let limitedDealPercent = null;
      if (limitedDealBadge) {
        const match = limitedDealBadge.match(/(\d+)%/);
        if (match) limitedDealPercent = parseInt(match[1]);
      }

      // Final price after coupon
      let finalPrice = dealPrice;
      if (couponType === 'percentage' && couponValue) {
        finalPrice = dealPrice * (1 - couponValue / 100);
      } else if (couponType === 'amount' && couponValue) {
        finalPrice = dealPrice - couponValue;
      }
      finalPrice = Math.round(finalPrice * 100) / 100;

      // Total discount %
      let discountPercent = null;
      if (originalPrice > 0 && dealPrice > 0) {
        discountPercent = Math.round((1 - dealPrice / originalPrice) * 100);
      }

      if (dealPrice > 0) {
        deals.push({
          asin,
          name: name.substring(0, 200),
          deal_price:           dealPrice,
          original_price:       originalPrice || null,
          final_price:          finalPrice,
          coupon_text:          couponText || null,
          coupon_type:          couponType,
          coupon_value:         couponValue,
          limited_deal_percent: limitedDealPercent,
          discount_percent:     discountPercent,
          image_url:            imgUrl || null,
          affiliate_url:        affiliateUrl,
          store:                'Amazon UAE',
          is_limited_time:      !!limitedDealBadge,
        });
      }
    } catch (e) {
      console.warn('Error scraping card:', e);
    }
  });

  console.log(`Scraped ${deals.length} valid deals`);
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
    return false; // synchronous — no need to keep channel open
  }

  if (request.action === 'scrapeDeals') {
    // ACK immediately so the message channel doesn't time out
    sendResponse({ status: 'started' });

    try {
      const deals = scrapeAmazonDealsPage();
      chrome.storage.local.set({
        scrapedDeals:  deals,
        scrapeComplete: true,
        scrapeCount:   deals.length,
        scrapeTime:    Date.now(),
      });
    } catch (e) {
      chrome.storage.local.set({
        scrapeComplete: true,
        scrapeError:   e.message,
        scrapedDeals:  [],
      });
    }
    return false;
  }

  if (request.action === 'ping') {
    sendResponse({ success: true, store: detectStore(), isDealsPage: isAmazonDealsPage() });
    return false;
  }
});
