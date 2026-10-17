import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PAGES = ["/signin", "/signup"];
const AUTH_API_PREFIX = "/api/auth/";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Always allow better-auth API endpoints through.
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // 2) Public pages: signin / signup. If already signed in, redirect to /.
  if (PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const sessionCookie = getSessionCookie(request);
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 3) Allow Next.js internals and static asset paths.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 4) Other API routes self-protect via `getUser()` in their handlers —
  //    let them through and let them return 401 if needed.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 5) Protected pages: require a session cookie.
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
    // ─── SANDBOX AUTO-LOGIN ───────────────────────────────────────────────
    // In production, REPLACE this entire block with:
    //
    //   const url = new URL("/signin", request.url);
    //   url.searchParams.set("callbackUrl", pathname);
    //   return NextResponse.redirect(url);
    //
    // The auto-login mints a session for the seeded admin user
    // (admin@example.com) and sets the cookie on BOTH the request headers
    // (so the current request's server components can read it via
    // `getUser()`) AND the response (so the browser persists it).
    // try {
    //   const token = authHelpers.createSessionForDefaultAdmin();
    //   const cookieName = "better-auth.session_token";
    //   const cookieValue = `${cookieName}=${token}`;

    //   // Forward the cookie to the request so `getUser()` sees it on this pass.
    //   const requestHeaders = new Headers(request.headers);
    //   const existingCookie = requestHeaders.get("cookie") ?? "";
    //   requestHeaders.set(
    //     "cookie",
    //     existingCookie ? `${existingCookie}; ${cookieValue}` : cookieValue,
    //   );

    //   const res = NextResponse.next({ request: { headers: requestHeaders } });
    //   res.cookies.set(cookieName, token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "lax",
    //     path: "/",
    //     maxAge: 7 * 24 * 60 * 60,
    //   });
    //   return res;
    // } catch {
    //   // If auto-login fails for any reason, fall back to redirecting to /signin.
    //   const url = new URL("/signin", request.url);
    //   url.searchParams.set("callbackUrl", pathname);
    //   return NextResponse.redirect(url);
    // }
    // ─── END SANDBOX AUTO-LOGIN ───────────────────────────────────────────
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next.js static internals and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};