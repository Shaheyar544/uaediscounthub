import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supaUrl, supaKey);

async function run() {
  // Mock data as if from extension
  const deal = {
    asin: 'B0DEALTEST123',
    name: 'Manual Test Deal',
    deal_price: 99.99,
    affiliate_url: 'https://www.amazon.ae/dp/B0DEALTEST123'
  };

  const dealData = {
    asin: deal.asin,
    title_en: deal.name,
    deal_price: deal.deal_price,
    affiliate_url: deal.affiliate_url,
    is_active: true,
    source: 'manual_test'
  };

  console.log("Upserting dealData:", dealData);

  const { data, error } = await supabase
    .from('deals')
    .upsert(dealData, { onConflict: 'asin', ignoreDuplicates: false })
    .select()

  if (error) {
    console.error("❌ ERROR:", error.message, error.details, error.hint);
  } else {
    console.log("✅ SUCCESS:", data);
  }
}

run();
