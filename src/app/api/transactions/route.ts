import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { mapTransactionRow, parseTransaction } from "@/lib/validation";

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

    return NextResponse.json((data ?? []).map(mapTransactionRow));
  } catch (err) {
    console.error("[transactions GET] Unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST /api/transactions ────────────────────────────────────────────────────
// Body: one transaction, or an array of transactions (CSV import, inserted atomically).

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

    const items: unknown[] = Array.isArray(body) ? body : [body];
    if (items.length === 0) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

    const payloads = [];
    for (const [i, item] of items.entries()) {
      const parsed = parseTransaction(item);
      if ("error" in parsed) {
        const where = Array.isArray(body) ? ` (ligne ${i + 1})` : "";
        return NextResponse.json({ error: parsed.error + where }, { status: 400 });
      }
      payloads.push(parsed.data);
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert(payloads)
      .select();

    if (error) {
      console.error("[transactions POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map(mapTransactionRow);
    return NextResponse.json(Array.isArray(body) ? rows : rows[0], { status: 201 });
  } catch (err) {
    console.error("[transactions POST] Unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
