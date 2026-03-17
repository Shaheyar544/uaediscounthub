import { createClient } from './utils/supabase/server'

async function test() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select(`
      id, code,
      stores ( name, logo_url )
    `)
    .limit(1)
  
  if (error) {
    console.error('Query Error:', error)
  } else {
    console.log('Query Success:', JSON.stringify(data, null, 2))
  }
}

test()
