import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Database features will not work.');
}

// Only initialize if URL is present to prevent crash
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey || '') 
  : (null as any);
