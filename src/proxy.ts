import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths accessible without authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/cron/snapshot"];

// Static / internal prefixes — always bypassed
const STATIC_PREFIXES = [
  "/_next",          // All Next.js internals (static, image, HMR, data, etc.)
  "/__nextjs",       // Dev-overlay routes (__nextjs_original-stack-frame, etc.)
  "/favicon.ico",
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Always allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Validate authentication cookie
  const authToken = request.cookies.get("access_token");
  const isAuthenticated = authToken?.value === "true";

  if (!isAuthenticated) {
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
    // Match everything except Next.js internals and static files
    "/((?!_next|__nextjs|favicon.ico).*)",
  ],
};
