// /tmp/get_stores.js
const { createClient } = require('@supabase/supabase-js')
const url = 'https://cqsoceyqivsfrarcwptb.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxc29jZXlxaXZzZnJhcmN3cHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzM5NCwiZXhwIjoyMDg4NTYzMzk0fQ.hEzlBRSHsqLa-74dANjpZAbP21w8VAfbgLT8OH-9ApI'
const supabase = createClient(url, key)
async function run() {
  const { data, error } = await supabase.from('stores').select('id, name').ilike('name', '%amazon%')
  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}
run()
