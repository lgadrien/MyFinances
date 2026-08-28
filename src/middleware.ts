import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, getExpectedToken } from "@/lib/auth";

// Paths accessible without authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/cron/snapshot"];

// Static / internal prefixes — always bypassed
const STATIC_PREFIXES = [
  "/_next",          // All Next.js internals (static, image, HMR, data, etc.)
  "/__nextjs",       // Dev-overlay routes (__nextjs_original-stack-frame, etc.)
  "/favicon.ico",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Always allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Validate authentication cookie with secret
  const accessPassword = process.env.ACCESS_PASSWORD;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME);
  
  let isAuthenticated = false;
  if (accessPassword && authToken?.value) {
    const expectedToken = await getExpectedToken(accessPassword);
    isAuthenticated = authToken.value === expectedToken;
  }

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
