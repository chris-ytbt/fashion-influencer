import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const protectedPaths = ['/app', '/settings'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Read Supabase auth cookies. Accept either the standard 'sb-access-token'
  // or any of our client cookies that start with 'sb' (e.g., 'sb', 'sb-...').
  const hasToken =
    req.cookies.has('sb-access-token') ||
    req.cookies.getAll().some((c) => c.name === 'sb' || c.name.startsWith('sb-'));

  // If user is authenticated and tries to visit the landing page ("/"),
  // always redirect them to "/app".
  if (pathname === '/' && hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/app';
    url.searchParams.delete('redirectedFrom');
    return NextResponse.redirect(url);
  }

  // Protect authenticated-only routes
  if (!isProtected) return NextResponse.next();

  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/app/:path*', '/settings/:path*'],
};
