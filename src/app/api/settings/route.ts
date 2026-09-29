import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── GET /api/settings ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("cash_balance, target_capital")
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json({
      cash_balance: Number(data.cash_balance),
      target_capital: Number(data.target_capital),
    });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT /api/settings ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

    const cash_balance = Number(body.cash_balance);
    const target_capital = Number(body.target_capital);

    if (isNaN(cash_balance) || isNaN(target_capital)) {
      return NextResponse.json({ error: "Valeurs invalides" }, { status: 400 });
    }

    // Fetch the settings row id (single-row table)
    const { data: row } = await supabaseAdmin
      .from("settings")
      .select("id")
      .limit(1)
      .single();

    if (!row) {
      return NextResponse.json({ error: "Paramètres introuvables" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("settings")
      .update({
        cash_balance,
        target_capital,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      console.error("[settings PUT]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
