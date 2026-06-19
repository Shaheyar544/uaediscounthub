const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPages() {
  const { data, error } = await supabase
    .from('pages')
    .update({ is_active: true })
    .in('slug', ['cookie-policy', 'disclaimer-page'])
    .select();
  
  if (error) {
    console.error('Error fixing pages:', error);
    return;
  }
  
  console.log('Fixed pages:');
  data.forEach(page => {
    console.log(`Page: ${page.title_en} | Slug: ${page.slug} | Status: ${page.status} | Active: ${page.is_active}`);
  });
}

fixPages();
