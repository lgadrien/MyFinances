import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Handle Favorites (GET, POST, DELETE)
 *
 * GET: Return all favorite tickers for the authenticated user.
 * POST: Add a ticker to favorites.
 * DELETE: Remove a ticker from favorites.
 */

// If using Auth, we get user_id from token. For demo without auth, we might use a fixed ID or anon key if RLS allows.
// Given the context of "Phase 2" and no full auth flow, we'll assume either:
// 1. Auth is optional and we use anon RLS policy (risky for prod but OK for local demo)
// 2. We mock a user ID or skip RLS.
// Let's assume we use standard Supabase client which handles session if present.

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("ticker")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const tickers = data?.map((f) => f.ticker) || [];
    return NextResponse.json({ favorites: tickers });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ favorites: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ticker } = await req.json();
    if (!ticker)
      return NextResponse.json({ error: "Ticker required" }, { status: 400 });

    // Insert
    const { error } = await supabase
      .from("favorites")
      .insert([{ ticker }])
      .select();

    if (error) {
      // Ignore duplicate key error (already favorited)
      if (error.code === "23505") return NextResponse.json({ success: true });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get("ticker");

    if (!ticker)
      return NextResponse.json({ error: "Ticker required" }, { status: 400 });

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("ticker", ticker);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
