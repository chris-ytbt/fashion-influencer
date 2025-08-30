"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const supabaseReady = isSupabaseConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseReady) return;
    const supabase = getSupabaseBrowser();
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session) router.replace('/app');
    };
    check();

    return () => { cancelled = true; };
  }, [router, supabaseReady]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.replace('/app');
      } else {
        setError('Unable to sign in.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start Google sign-in';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Create social image assets for your branding in a minute</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Turn a single photo into multiple on-brand influencer visuals. Powered by AI.</p>
            {!supabaseReady && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
                Auth is disabled because Supabase env vars are missing. Create a .env.local at project root and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See README.
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" required />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <button type="submit" disabled={!supabaseReady || loading} className="w-full px-4 py-2 bg-black text-white rounded-md disabled:opacity-60">
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            <div className="my-4 h-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={handleGoogleLogin}
              disabled={!supabaseReady}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F1F1F] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2A2A2A] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 disabled:opacity-60"
              aria-label="Sign in with Google"
            >
              <span aria-hidden="true" className="inline-flex">
                {/* Official "G" mark constructed with four colors per Google Identity guidelines */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.837 32.226 29.356 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.7 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.817C14.466 15.676 18.879 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.7 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.305 0 10.154-2.038 13.79-5.351l-6.364-5.386C29.356 36 24.874 36 24 36c-5.334 0-9.804-3.761-11.293-8.853l-6.55 5.05C9.454 39.556 16.125 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.147 3.589-3.77 6.502-7.303 8.18l6.364 5.386C37.396 39.037 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
              </span>
              <span className="text-sm font-medium tracking-normal">Sign in with Google</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
