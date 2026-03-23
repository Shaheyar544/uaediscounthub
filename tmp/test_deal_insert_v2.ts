import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supaUrl, supaKey);

async function run() {
  const deal = {
    asin: 'B0DEALTEST456', // New ASIN
    name: 'Manual Test Deal 2',
    deal_price: 129.99,
    affiliate_url: 'https://www.amazon.ae/dp/B0DEALTEST456'
  };

  const dealData = {
    asin: deal.asin,
    title_en: deal.name,
    deal_price: deal.deal_price,
    affiliate_url: deal.affiliate_url,
    is_active: true,
    source: 'manual_test_v2'
  };

  console.log("Checking for existing ASIN:", deal.asin);
  const { data: existing } = await supabase.from('deals').select('id').eq('asin', deal.asin).maybeSingle();

  if (existing) {
    console.log("Updating existing ID:", existing.id);
    const { data, error } = await supabase.from('deals').update(dealData).eq('id', existing.id).select();
    if (error) console.error("Update Error:", error.message);
    else console.log("Update Success:", data);
  } else {
    console.log("Inserting new deal...");
    const { data, error } = await supabase.from('deals').insert(dealData).select();
    if (error) console.error("Insert Error:", error.message);
    else console.log("Insert Success:", data);
  }
}

run();
