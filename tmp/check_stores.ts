import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supaUrl, supaKey);

async function run() {
  const { data: stores, error } = await supabase.from('stores').select('id, name, slug');
  if (error) {
    console.error("Error fetching stores:", error.message);
    return;
  }
  console.log("All stores:", JSON.stringify(stores, null, 2));
}

run();
