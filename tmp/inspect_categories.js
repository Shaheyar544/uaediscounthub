const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCategories() {
  const { data: categories, error } = await supabase.from('categories').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log('Category structure:', JSON.stringify(categories[0], null, 2));
  }
}

inspectCategories();
