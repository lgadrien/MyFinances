import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Input validation ──────────────────────────────────────────────────────────

const TICKER_RE = /^[A-Z0-9^.=-]{1,12}$/;

function sanitizeTicker(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return TICKER_RE.test(t) ? t : null;
}

// ── GET /api/favorites ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("ticker")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const tickers = (data ?? []).map((f) => f.ticker as string);
    return NextResponse.json({ favorites: tickers });
  } catch (error) {
    console.error("[favorites GET]", error);
    return NextResponse.json({ favorites: [] }, { status: 500 });
  }
}

// ── POST /api/favorites ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const ticker = sanitizeTicker(body?.ticker);

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker invalide ou manquant" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("favorites").insert([{ ticker }]);

    if (error) {
      // PG unique violation → already favorited, treat as success
      if (error.code === "23505") return NextResponse.json({ success: true });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[favorites POST]", error);
    return NextResponse.json(
      { error: "Impossible d'ajouter le favori" },
      { status: 500 },
    );
  }
}

// ── DELETE /api/favorites?ticker=XXX ─────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const raw = new URL(req.url).searchParams.get("ticker");
    const ticker = sanitizeTicker(raw);

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker invalide ou manquant" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("ticker", ticker);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[favorites DELETE]", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le favori" },
      { status: 500 },
    );
  }
}
