import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TYPES = ["Achat", "Vente", "Dividende"] as const;

function mapRow(t: Record<string, unknown>) {
  return {
    ...t,
    quantity: Number(t.quantity),
    unit_price: Number(t.unit_price),
    total_amount: Number(t.total_amount),
    fees: Number(t.fees),
  };
}

function validatePayload(body: Record<string, unknown>): string | null {
  const { ticker, type, date, quantity, total_amount, fees } = body;
  if (!ticker || typeof ticker !== "string" || !String(ticker).trim()) return "Ticker manquant";
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) return "Type invalide";
  if (!date || typeof date !== "string" || isNaN(Date.parse(String(date)))) return "Date invalide";
  if (Number(quantity) < 0) return "Quantité négative";
  if (Number(total_amount) < 0) return "Montant négatif";
  if (Number(fees) < 0) return "Frais négatifs";
  return null;
}

// ── GET /api/transactions ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("id, ticker, type, date, quantity, unit_price, total_amount, fees, created_at")
      .order("date", { ascending: false });

    if (error) {
      console.error("[transactions GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
  } catch (err) {
    console.error("[transactions GET] Unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST /api/transactions ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

    const validationError = validatePayload(body as Record<string, unknown>);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const payload = {
      ticker: String(body.ticker).trim().toUpperCase(),
      type: body.type,
      date: body.date,
      quantity: Number(body.quantity),
      unit_price: Number(body.unit_price),
      total_amount: Number(body.total_amount),
      fees: Number(body.fees),
    };

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[transactions POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapRow(data as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error("[transactions POST] Unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
