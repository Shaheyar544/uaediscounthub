const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log('--- Detailed Column Inspection ---');
  
  // Method: Try to insert a record with only ASIN and see what IT COMPLAINS about
  const { error: insError } = await supabase.from('deals').insert({ asin: 'MANDATORY_TEST' });
  
  if (insError) {
    console.log('Insert Error:', insError.message);
    console.log('Details:', insError.details);
    console.log('Hint:', insError.hint);
  } else {
    console.log('Insert succeeded! No mandatory fields besides ASIN?');
  }

  // Check if store_id or product_id are mandatory
  const { error: storeError } = await supabase.from('deals').insert({ asin: 'STORE_TEST', title_en: 'Test' });
  console.log('Store Test Result:', storeError?.message || 'Success');

  // Check current table structure via sample
  const { data: samples } = await supabase.from('deals').select('*').limit(1);
  if (samples?.[0]) {
    console.log('Available Columns:', Object.keys(samples[0]));
  }
}

inspect();
