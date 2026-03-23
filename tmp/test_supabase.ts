import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supaUrl || !supaKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supaUrl, supaKey);

async function run() {
  const dealData = {
    // missing product_id and store_id to see if it allows null
    asin: 'B0TESTASIN123',
    title_en: 'Test Deal Name',
    deal_price: 19.99,
    source: 'amazon_deals',
    is_active: true
  };

  const { data, error } = await supabase
    .from('deals')
    .upsert(dealData, { onConflict: 'asin', ignoreDuplicates: false })

  if (error) {
    console.error("UPSERT ERROR:", error.message, error.details, error.hint);
  } else {
    console.log("SUCCESS:", data);
  }
}

run();
