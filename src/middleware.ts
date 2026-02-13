import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that do not require authentication
const publicPaths = ["/login", "/api/auth/login", "/api/cron/snapshot"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check for authentication cookie
  const authToken = request.cookies.get("access_token");

  if (!authToken) {
    // If accessing API without token, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Otherwise redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
