const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPages() {
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title_en, status, is_active');
  
  if (error) {
    console.error('Error fetching pages:', error);
    return;
  }
  
  data.forEach(page => {
    console.log(`Page: ${page.title_en} | Slug: ${page.slug} | Status: ${page.status} | Active: ${page.is_active}`);
  });
}

checkPages();
