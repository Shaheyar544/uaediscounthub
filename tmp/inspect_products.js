const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProducts() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  console.log('Product Columns:', Object.keys(data[0]));
  console.log('Sample Product:', JSON.stringify(data[0], null, 2));
}

inspectProducts();
