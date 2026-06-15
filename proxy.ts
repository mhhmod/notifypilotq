import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "np_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/push/subscribe",
  "/api/push/unsubscribe",
  "/api/push/click",
  "/shopify-push-client.js",
  "/push-service-worker.js"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (pathname.startsWith("/dashboard") && !request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublic && pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
