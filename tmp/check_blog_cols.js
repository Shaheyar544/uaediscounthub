const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBlogCols() {
  const { data, error } = await supabase.from('blog_posts').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  if (data && data[0]) {
    console.log('Blog Post Columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('No blog posts found to inspect columns.');
  }
}

checkBlogCols();
