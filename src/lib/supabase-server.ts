import { createServerClient } from '@supabase/ssr';

export const getSupabaseServer = () => {
  // Note: We are not using next/headers here to avoid client bundling issues.
  // If you need cookie-aware server helpers later, switch to route handlers or
  // server components and wire up Next's cookies accordingly.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(_name: string) {
          return undefined;
        },
      },
    }
  );
};
