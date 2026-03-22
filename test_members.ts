import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkSchema() {
  const { data, error } = await supabase
    .from('checki_members')
    .select('id, name, place_id, member_code')
    .limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

checkSchema();
