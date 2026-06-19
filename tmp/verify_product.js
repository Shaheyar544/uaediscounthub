const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name_en, slug')
    .ilike('name_en', '%Honor Pad 9%');
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('Matching Products:', JSON.stringify(data, null, 2));
}

verifyProduct();
