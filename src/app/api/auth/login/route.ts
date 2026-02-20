import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Simple in-memory rate limiter for login attempts.
 * Key = IP address. Resets after WINDOW_MS.
 *
 * Note: This is per-instance. On Vercel hobby (single region) it works fine.
 * For multi-region production, use Upstash Redis instead.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    // Fresh window
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    retryAfterMs: 0,
  };
}

/** Reset attempt count on successful login */
function clearRateLimit(ip: string) {
  attempts.delete(ip);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      {
        error: "Trop de tentatives. Réessayez dans quelques minutes.",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(MAX_ATTEMPTS),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const body = await request.json();
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";
    const correctPassword = process.env.ACCESS_PASSWORD;

    if (!correctPassword) {
      console.error("[auth/login] ACCESS_PASSWORD not set");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Mot de passe requis" },
        { status: 400 },
      );
    }

    if (password === correctPassword) {
      // Success — reset rate limit counter for this IP
      clearRateLimit(ip);

      const cookieStore = await cookies();
      cookieStore.set("access_token", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days (was 1 day)
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Mot de passe incorrect", remaining },
      { status: 401, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
