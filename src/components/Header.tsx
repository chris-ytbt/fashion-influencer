"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase-browser';

export default function Header() {
  const [profile, setProfile] = React.useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const onLanding = pathname === '/' || pathname?.startsWith('/login');
  const supabaseReady = isSupabaseConfigured();

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.profile) {
          setProfile({ full_name: json.profile.full_name, avatar_url: json.profile.avatar_url });
        }
      } catch {}
    };
    if (!onLanding && supabaseReady) load();
    return () => { cancelled = true; };
  }, [onLanding, supabaseReady]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={profile ? "/app" : "/"} className="font-semibold">just_banana</Link>
        {onLanding ? (
          supabaseReady ? (
            <Link href="/login" className="px-4 py-2 bg-black text-white rounded-md">Log In</Link>
          ) : (
            <span className="text-xs text-gray-500" title="Supabase env vars missing; set .env.local at project root">Auth unavailable</span>
          )
        ) : (
          <div className="flex items-center gap-4 text-sm">
            {!profile && <Link href="/app" className="hover:underline">App</Link>}
            <Link href="/settings" className="hover:underline">Settings</Link>
            {profile && (
              <div className="flex items-center gap-2">
                {profile.avatar_url && (<img src={profile.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />)}
                <span className="text-gray-700 dark:text-gray-300 max-w-[10rem] truncate">{profile.full_name || 'Account'}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-red-600 hover:underline">Log Out</button>
          </div>
        )}
      </div>
    </nav>
  );
}
