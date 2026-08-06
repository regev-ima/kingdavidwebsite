import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'The site will fall back to local product data.'
  );
}

// `createClient('', '')` throws ("supabaseUrl is required") at module load,
// which takes the whole app down to a blank page before anything renders.
// When the env vars are absent, hand back a stub instead so the callers in
// base44Client.js can do what they already promise: fall back to the local
// product data. Every entry point checks `isSupabaseConfigured` first, so
// the stub only ever guards against a missed check.
const notConfigured = async () => ({
  data: null,
  error: new Error('Supabase is not configured'),
});

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : { rpc: notConfigured, functions: { invoke: notConfigured } };
