import { createBrowserClient } from '@supabase/ssr';

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const getSupabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const msg = `@supabase/ssr: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.\n` +
      `Create a .env.local at the project root and set both variables.\n` +
      `Use the Supabase Project Settings → API → Publishable key. See README → Supabase Setup.`;
    // Always throw with clear guidance to prevent silent failures
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error(msg);
    }
    throw new Error(msg);
  }
  return createBrowserClient(url, key, {
    cookieOptions: { name: 'sb' },
  });
};
