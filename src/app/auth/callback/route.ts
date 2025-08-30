import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirectTo') || '/app';
  // Supabase sets cookies itself via OAuth callback; we just redirect to app
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
