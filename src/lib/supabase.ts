import { createClient } from '@supabase/supabase-js';

// Get environment variables or fallback placeholders
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
    // import.meta.env.VITE_SUPABASE_URL !== 'https://example.supabase.co'
  );
};
