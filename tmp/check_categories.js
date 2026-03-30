const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategoriesTable() {
  const { data: categories, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
  } else {
    console.log('Found categories table:', JSON.stringify(categories, null, 2));
  }
}

checkCategoriesTable();
