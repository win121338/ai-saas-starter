import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { localeFromPath, stripLocale } from "@/lib/i18n";

// Optimistic redirect for signed-out visitors to (app) routes. This checks
// only that a session cookie EXISTS — it is UX, not auth. The security
// boundary is requireSession() inside every (app) page and server action
// (AGENTS.md: never trust middleware alone).
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = localeFromPath(pathname);
  const route = stripLocale(pathname);
  const protectedRoute = [
    "/dashboard",
    "/generate",
    "/creations",
    "/billing",
    "/settings",
    "/admin",
  ].some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
  if (protectedRoute && !getSessionCookie(request)) {
    const url = new URL(locale === "zh" ? "/zh/login" : "/login", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-artora-locale", locale);
  requestHeaders.set("x-artora-path", pathname);
  if (locale === "zh") {
    const url = request.nextUrl.clone();
    url.pathname = route;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
