const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  // We can't directly inspect schema via supabase-js in a robust way for defaults easily without RPC or raw SQL
  // But we can try to insert a dummy record and see what happens, or check the existing ones
  
  console.log('--- Inspecting Pages table ---');
  const { data: pages, error: pagesError } = await supabase.from('pages').select('*').limit(1);
  if (pagesError) console.error(pagesError);
  else console.log('Pages record sample:', JSON.stringify(pages[0], null, 2));

  console.log('--- Inspecting Blog Posts table ---');
  const { data: posts, error: postsError } = await supabase.from('blog_posts').select('*').limit(1);
  if (postsError) console.error(postsError);
  else console.log('Blog Posts record sample:', JSON.stringify(posts[0], null, 2));
}

inspectSchema();
