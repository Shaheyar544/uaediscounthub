import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function readEnvFile(path) {
  const env = {};
  const content = readFileSync(path, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;
    env[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return env;
}

async function fetchAllRows(supabase, tableName, pageSize = 1000) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

const env = readEnvFile(join(process.cwd(), '.env.local'));
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const outputDir = join(process.cwd(), 'exports', 'supabase');
mkdirSync(outputDir, { recursive: true });

const tables = [
  'profiles',
  'categories',
  'stores',
  'products',
  'product_prices',
  'product_store_prices',
  'coupons',
  'deals',
  'affiliate_clicks',
  'price_alerts',
  'wishlists',
  'price_history',
  'blog_posts',
  'blog_categories',
  'blog_ad_widgets',
  'community_reports',
  'comparisons',
  'newsletter_subscribers',
  'api_sync_logs',
  'pages',
  'site_settings',
  'assets',
];

const manifest = {
  exportedAt: new Date().toISOString(),
  tables: {},
  failedTables: {},
};

for (const tableName of tables) {
  try {
    const rows = await fetchAllRows(supabase, tableName);
    writeFileSync(
      join(outputDir, `${tableName}.json`),
      JSON.stringify(rows, null, 2),
      'utf8'
    );
    manifest.tables[tableName] = rows.length;
    console.log(`Exported ${tableName}: ${rows.length} rows`);
  } catch (error) {
    manifest.failedTables[tableName] = error.message;
    console.error(`Failed ${tableName}: ${error.message}`);
  }
}

writeFileSync(
  join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);

console.log(`Wrote manifest to ${join(outputDir, 'manifest.json')}`);
