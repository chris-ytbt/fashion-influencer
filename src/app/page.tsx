"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase-browser';

export default function Landing() {
  const router = useRouter();
  const redirectedFrom = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirectedFrom') : null;

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowser();
    let cancelled = false;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        const target = redirectedFrom;
        const safeTarget = target && target.startsWith('/') ? target : '/app';
        router.replace(safeTarget);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [router, redirectedFrom]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Create social image assets for your branding in a minute</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Turn a single photo into multiple on-brand influencer visuals. Powered by AI.</p>
            {/* Button removed from hero section per requirement */}
          </div>
          <div className="h-64 md:h-80 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
