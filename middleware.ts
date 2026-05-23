// Next.js route protection. Runs before page render.
// We only check that a session marker cookie is present here. Real auth
// (role, status) is enforced server-side on every API call.
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/documents", "/jobs/post", "/jobs/my", "/team", "/participants", "/messages", "/notifications", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // The refresh cookie is HttpOnly and set by the backend.
  const hasRefresh = req.cookies.has("shiftify_refresh");
  if (!hasRefresh) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/documents/:path*",
    "/jobs/post",
    "/jobs/my",
    "/team/:path*",
    "/participants/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};
