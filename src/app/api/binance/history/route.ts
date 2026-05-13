import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Clés API Binance manquantes" },
      { status: 400 }
    );
  }

  try {
    const timestamp = Date.now();
    const queryString = `type=SPOT&limit=30&timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const res = await fetch(
      `https://api.binance.com/sapi/v1/accountSnapshot?${queryString}&signature=${signature}`,
      {
        headers: { "X-MBX-APIKEY": apiKey },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Binance History Error:", errorText);
      return NextResponse.json({ error: "Erreur API Binance" }, { status: res.status });
    }

    const data = await res.json();
    
    // On a besoin du prix actuel du BTC pour convertir le snapshot (qui est en BTC)
    const tickerRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR");
    const tickerData = await tickerRes.json();
    const btcEurPrice = parseFloat(tickerData.price) || 60000;

    // Transformer les snapshots en format compatible avec le graphique
    // Le snapshot de Binance donne totalAssetOfBtc
    const history = (data.snapshotVos || []).map((s: any) => {
      const date = new Date(s.updateTime).toISOString().split("T")[0];
      const totalValueBtc = parseFloat(s.data.totalAssetOfBtc);
      return {
        date,
        total_value: totalValueBtc * btcEurPrice, // Approximation avec prix actuel car on n'a pas l'historique du prix du BTC ici
        total_invested: 0, // Binance ne donne pas cette info
      };
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Binance history route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
