// Next.js edge middleware — route protection only.
// Reads shiftify_is_auth (a non-HttpOnly boolean hint set by the Web auth store
// when a session is established/restored; it lives as long as the refresh session).
// It is only a hint: real role/status enforcement is done server-side on every
// API call, and the dashboard layout re-checks the real session client-side.

import { NextRequest, NextResponse } from 'next/server';

// Everything under app/(dashboard), plus the admin area and the post-signup
// setup/payment steps. Public pages (/, /shiftboard, /privacy, /terms and the
// auth pages) are deliberately not listed.
const PROTECTED = [
  '/dashboard',
  '/profile',
  '/profile-setup',
  '/documents',
  '/jobs',
  '/my-requests',
  '/my-support',
  '/team',
  '/participants',
  '/messages',
  '/notifications',
  '/admin',
  '/payment',
  '/setup',
  '/availability',
  '/blocked-users',
  '/connect-invites',
  '/connections',
  '/coordinator-connections',
  '/coordinators',
  '/find',
  '/help-safety',
  '/invoices',
  '/job-invites',
  '/live-dashboard',
  '/load-board',
  '/provider',
  '/referrals',
  '/saved-professionals',
  '/subscription',
  '/upcoming-support',
  '/workers',
];

// Pages that should NOT be accessible once logged in
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

// Match on whole path segments so "/jobs" never captures an unrelated "/jobsite".
const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(prefix + '/');

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuth = req.cookies.get('shiftify_is_auth')?.value === 'true';

  // Redirect logged-in users away from auth pages
  if (isAuth && AUTH_PAGES.some((p) => matches(pathname, p))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Guests may fill in a request before signing up (cart-style draft, see lib/store/guestJobDraft.ts);
  // the posting pages hold the draft locally and send them to /register at the review step.
  if (matches(pathname, '/jobs/post')) return NextResponse.next();

  // Guard protected routes
  const needsAuth = PROTECTED.some((p) => matches(pathname, p));
  if (needsAuth && !isAuth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Every page route except Next internals and static files (anything with a dot).
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
