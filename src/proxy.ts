import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidSession } from "@/lib/auth";

// Paths accessible without authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/cron/snapshot"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!(await isValidSession(request.cookies.get(AUTH_COOKIE_NAME)?.value))) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Preserve the original destination for post-login redirect
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next.js internals and the PWA files, which browsers fetch without cookies
    "/((?!_next|__nextjs|favicon\\.ico|manifest\\.webmanifest|icon/|apple-icon).*)",
  ],
};
