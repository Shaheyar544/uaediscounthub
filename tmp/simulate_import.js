const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulate() {
  console.log('--- Simulating Import ---');
  
  // Exact same object as route.ts now has
  const dealData = {
    product_id:       null, // for test
    store_id:         '63a7593f-9541-4286-8186-8247282a438a', // Amazon UAE
    asin:             'B0TEST' + Date.now(),
    title_en:         'Simulated Product',
    image_url:        'https://example.com/img.jpg',
    deal_price:       100,
    final_price:      100,
    original_price:   150,
    discount_percent: 33,
    coupon_value:     null,
    coupon_type:      null,
    affiliate_url:    'https://www.amazon.ae/dp/B0TEST',
    expires_at:       null,
    currency:         'AED',
    source:           'amazon_deals',
    is_active:        true,
  };

  const { error } = await supabase.from('deals').insert(dealData);
  
  if (error) {
    console.log('SIMULATION FAILED!');
    console.log('Error:', error.message);
    console.log('Details:', error.details);
  } else {
    console.log('SIMULATION SUCCEEDED!');
  }
}

simulate();
