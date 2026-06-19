const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log('--- Detailed Column Inspection (products) ---');
  
  const { data: samples } = await supabase.from('products').select('*').limit(1);
  if (samples?.[0]) {
    console.log('Available Columns:', Object.keys(samples[0]));
  } else {
    console.log('No products found to inspect keys.');
  }

  // Check deals again to be 100% sure nothing is left
  const { data: dealSamples } = await supabase.from('deals').select('*').limit(1);
  if (dealSamples?.[0]) {
    console.log('Deals Columns:', Object.keys(dealSamples[0]));
  }
}

inspect();
