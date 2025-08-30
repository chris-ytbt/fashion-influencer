// Kept for backward-compat imports within this repository.
// Prefer importing from '@/lib/supabase-browser' in client components and
// '@/lib/supabase-server' in server code. These re-exports avoid pulling
// `next/headers` into the client bundle.

export { getSupabaseBrowser } from './supabase-browser';
export { getSupabaseServer } from './supabase-server';
