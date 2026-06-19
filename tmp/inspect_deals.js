const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
  console.log('--- Inspecting Deals Table ---');
  
  // Try to get column info
  const { data, error } = await supabase.rpc('get_table_columns_info', { table_name_input: 'deals' });
  
  if (error) {
    console.warn('RPC failed, trying sample data + error inspection...');
    // Fallback: try to insert a garbage record to see the error message
    const { error: insError } = await supabase.from('deals').insert({ asin: 'TEST_ASIN' });
    console.log('Sample Insert Error:', insError?.message);
    if (insError?.details) console.log('Details:', insError.details);

    // List one valid record to see fields
    const { data: samples } = await supabase.from('deals').select('*').limit(1);
    console.log('Sample Record Keys:', samples?.[0] ? Object.keys(samples[0]) : 'None found');
  } else {
    console.log('Columns:', data);
  }
}

inspect();
