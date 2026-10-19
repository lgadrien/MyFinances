import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline hydration scripts; eval is only needed by the dev server
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      // Inline styles (Tailwind, recharts)
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      // Images: self + data URIs (recharts SVG)
      "img-src 'self' data: blob:",
      // The browser only calls our API routes: Supabase and Yahoo are reached server-side
      "connect-src 'self'",
      // No plugin sources
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Security headers on all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Don't advertise the framework on every response
  poweredByHeader: false,

  // Strict mode for React (catches double-render bugs in dev)
  reactStrictMode: true,
};

export default nextConfig;
