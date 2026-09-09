import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iuqmqnicpypbpefewqad.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d9jX4Kr-uLapO6rvkaiZlw_krxS5Lly';

const globalForSupabase = globalThis;

export const supabase =
  globalForSupabase._supabaseInstance ||
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase._supabaseInstance = supabase;
}

export function getSupabaseClient() {
  return supabase;
}
