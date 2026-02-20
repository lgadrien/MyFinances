import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Enable XSS filter in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
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
      // Next.js scripts + inline evaluation (needed for recharts/react)
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Styles from Google Fonts + inline styles (Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts from Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (recharts SVG)
      "img-src 'self' data: blob:",
      // API connections: self + Supabase + Yahoo Finance
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
      // No plugin sources
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === "production"
        ? ["upgrade-insecure-requests"]
        : []),
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

  // Recommended image domains (Yahoo Finance logos etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Compression enabled by default in Next.js, but let's be explicit
  compress: true,

  // Strict mode for React (catches double-render bugs in dev)
  reactStrictMode: true,

  // Experimental: optimise package imports (reduces bundle size)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
