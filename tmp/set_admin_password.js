const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetAdmin() {
  const email = 'admin@uaediscounthub.com';
  const password = 'Wt$q!3coo^&5'; // Exact password without shell escapes

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!existing) {
    console.log('Creating new admin user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { role: 'admin', display_name: 'Administrator' }
    });
    if (error) throw error;
    console.log('User created:', data.user.id);
  } else {
    console.log('Updating password for existing user:', existing.id);
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { role: 'admin', display_name: 'Administrator' }
    });
    if (error) throw error;
    console.log('User password updated successfully.');
  }

  // Verify authentication with anon client
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('VERIFICATION FAILED:', signInError.message);
  } else {
    console.log('=============================================');
    console.log('VERIFICATION SUCCESSFUL!');
    console.log('Email:', signInData.user.email);
    console.log('Password verified:', password);
    console.log('User ID:', signInData.user.id);
    console.log('Role:', signInData.user.app_metadata?.role);
    console.log('=============================================');
  }
}

resetAdmin().catch(console.error);
