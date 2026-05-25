// Next.js edge middleware — route protection only.
// Reads shiftify_is_auth (a non-HttpOnly boolean flag set by the backend
// alongside the HttpOnly refresh cookie). Real role/status enforcement
// is done server-side on every API call.

import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/profile',
  '/documents',
  '/jobs/post',
  '/jobs/my',
  '/team',
  '/participants',
  '/messages',
  '/notifications',
  '/admin',
  '/payment',
];

// Pages that should NOT be accessible once logged in
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuth = req.cookies.get('shiftify_is_auth')?.value === 'true';

  // Redirect logged-in users away from auth pages
  if (isAuth && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Guard protected routes
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (needsAuth && !isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/documents/:path*',
    '/jobs/post',
    '/jobs/my',
    '/team/:path*',
    '/participants/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/admin/:path*',
    '/payment/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
