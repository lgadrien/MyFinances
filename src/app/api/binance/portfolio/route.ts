import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Veuillez configurer vos clés API Binance dans le fichier .env.local" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch balances
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const accountRes = await fetch(
      `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: { "X-MBX-APIKEY": apiKey },
        next: { revalidate: 0 },
      }
    );

    if (!accountRes.ok) {
      const err = await accountRes.text();
      console.error("Binance API error:", err);
      return NextResponse.json({ error: "Erreur de connexion à l'API Binance" }, { status: accountRes.status });
    }

    const accountData = await accountRes.json();
    const balances = accountData.balances.filter(
      (b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );

    // 2. Fetch prices (we need all prices to compute EUR value)
    // We will get prices against USDT, and then USDT/EUR
    const tickerRes = await fetch("https://api.binance.com/api/v3/ticker/price");
    if (!tickerRes.ok) {
      return NextResponse.json({ error: "Erreur lors de la récupération des prix Binance" }, { status: 500 });
    }
    const tickers = await tickerRes.json();
    const priceMap = new Map<string, number>();
    tickers.forEach((t: any) => {
      priceMap.set(t.symbol, parseFloat(t.price));
    });

    const eurUsdtPrice = priceMap.get("EURUSDT") || 1.08; // fallback if not found
    const usdtEurPrice = 1 / eurUsdtPrice;

    // 3. Format as EnrichedPosition
    const positions = balances.map((b: any) => {
      const asset = b.asset;
      const totalQuantity = parseFloat(b.free) + parseFloat(b.locked);
      
      let priceInEUR = 0;
      
      if (asset === "EUR") {
        priceInEUR = 1;
      } else if (asset === "USDT") {
        priceInEUR = usdtEurPrice;
      } else {
        // Try direct EUR pair
        if (priceMap.has(`${asset}EUR`)) {
          priceInEUR = priceMap.get(`${asset}EUR`)!;
        } 
        // Try USDT pair then convert to EUR
        else if (priceMap.has(`${asset}USDT`)) {
          priceInEUR = priceMap.get(`${asset}USDT`)! * usdtEurPrice;
        } 
        // Try BTC pair then convert to EUR
        else if (priceMap.has(`${asset}BTC`) && priceMap.has("BTCEUR")) {
          priceInEUR = priceMap.get(`${asset}BTC`)! * priceMap.get("BTCEUR")!;
        }
      }

      const capitalValue = totalQuantity * priceInEUR;

      return {
        ticker: asset,
        name: asset,
        sector: "Crypto",
        totalQuantity,
        totalInvested: capitalValue, // We assume invested = current value since we don't have PRU history easily
        pru: priceInEUR,
        currentPrice: priceInEUR,
        plusValue: 0,
        capitalValue: capitalValue,
      };
    });

    // Sort by value descending
    positions.sort((a: any, b: any) => b.capitalValue - a.capitalValue);

    return NextResponse.json({ positions });
  } catch (error: any) {
    console.error("Binance portfolio error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
