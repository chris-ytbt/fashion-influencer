import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        // Read cookie from the incoming request
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.split(';').map(s => s.trim()).find(c => c.startsWith(name + '='));
        return match ? match.split('=')[1] : undefined;
      },
    },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ user: null, profile: null }, { status: 200 });
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ user, profile: null, error: error.message }, { status: 200 });
  }
  return NextResponse.json({ user, profile }, { status: 200 });
}
