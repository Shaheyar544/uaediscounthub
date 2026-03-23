import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supaUrl, supaKey);

async function run() {
  const { count: dealsCount } = await supabase.from('deals').select('*', { count: 'exact', head: true });
  const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  
  console.log(`Deals count: ${dealsCount}`);
  console.log(`Products count: ${productsCount}`);

  if (dealsCount > 0) {
      const { data: recentDeals } = await supabase.from('deals').select('*').limit(5).order('created_at', { ascending: false });
      console.log("Recent deals:", JSON.stringify(recentDeals, null, 2));
  }
}

run();
