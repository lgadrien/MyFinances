import { describe, it, expect } from "vitest";
import { parseTransactionsCSV, transactionsToCSV } from "@/lib/csv";
import type { Transaction } from "@/lib/types";

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: "id-1",
  ticker: "MC.PA",
  type: "Achat",
  date: "2024-01-15",
  quantity: 2,
  unit_price: 700.25,
  total_amount: 1400.5,
  fees: 1.99,
  created_at: "2024-01-15T10:00:00Z",
  ...over,
});

const HEADER = "ID;Date;Type;Ticker;Quantité;Prix Unitaire;Montant Total;Frais";

describe("CSV export", () => {
  it("writes a BOM, ';' separators, decimal commas and CRLF for French Excel", () => {
    expect(transactionsToCSV([tx(), tx({ id: "id-2", fees: 0 })])).toBe(
      "﻿" +
        HEADER +
        "\r\nid-1;2024-01-15;Achat;MC.PA;2;700,25;1400,5;1,99" +
        "\r\nid-2;2024-01-15;Achat;MC.PA;2;700,25;1400,5;0",
    );
  });

  it("neutralises spreadsheet formulas in text cells but leaves numbers alone", () => {
    const lines = transactionsToCSV([
      tx({ ticker: "=1+1" }),
      tx({ ticker: "+33" }),
      tx({ ticker: "-2" }),
      tx({ ticker: "@SUM(A1)", fees: -1 }),
    ]).split("\r\n");
    expect(lines[1]).toBe("id-1;2024-01-15;Achat;'=1+1;2;700,25;1400,5;1,99");
    expect(lines[2]).toContain(";'+33;");
    expect(lines[3]).toContain(";'-2;");
    expect(lines[4]).toBe("id-1;2024-01-15;Achat;'@SUM(A1);2;700,25;1400,5;-1");
  });
});

describe("CSV import", () => {
  it("reads a file re-saved by French Excel (';', decimal commas, dd/mm/yyyy, BOM, blank lines)", () => {
    const csv =
      "﻿" +
      HEADER +
      "\r\nid-1;15/01/2024;Achat;mc.pa;2;700,25;1 400,50;" +
      "\r\n\r\n" +
      "id-2;01/03/2024;Dividende;CW8.PA;0;0;12,34;0\r\n";
    expect(parseTransactionsCSV(csv)).toEqual({
      data: [
        { date: "2024-01-15", type: "Achat", ticker: "MC.PA", quantity: 2, unit_price: 700.25, total_amount: 1400.5, fees: 0 },
        { date: "2024-03-01", type: "Dividende", ticker: "CW8.PA", quantity: 0, unit_price: 0, total_amount: 12.34, fees: 0 },
      ],
    });
  });

  it("still reads the old ',' export, and quoted decimal commas", () => {
    const csv =
      "ID,Date,Type,Ticker,Quantité,Prix Unitaire,Montant Total,Frais\n" +
      "id-1,2024-01-15,Achat,MC.PA,2,700.25,1400.5,1.99\n" +
      'id-2,2024-01-16,Vente,MC.PA,"1,5","710,1","1065,15",0\n';
    expect(parseTransactionsCSV(csv)).toEqual({
      data: [
        { date: "2024-01-15", type: "Achat", ticker: "MC.PA", quantity: 2, unit_price: 700.25, total_amount: 1400.5, fees: 1.99 },
        { date: "2024-01-16", type: "Vente", ticker: "MC.PA", quantity: 1.5, unit_price: 710.1, total_amount: 1065.15, fees: 0 },
      ],
    });
  });

  it("reads '.' thousands separators next to a decimal comma", () => {
    const csv = "ID;Date;Type;Ticker;Quantité;Prix Unitaire;Montant Total;Frais\r\nx;2025-01-10;Achat;MC.PA;2;617,28;1.234,56;0";
    expect(parseTransactionsCSV(csv)).toMatchObject({ data: [{ unit_price: 617.28, total_amount: 1234.56 }] });
  });

  it("reports the real CSV line number of a bad row", () => {
    const ok = "id-1;2024-01-15;Achat;MC.PA;2;700,25;1400,5;0";
    expect(
      parseTransactionsCSV(`${HEADER}\r\n\r\n${ok}\r\nid-2;2024-01-16;Achat;MC.PA;deux;700,25;1400,5;0\r\n`),
    ).toEqual({ error: "Ligne 4 : Quantité invalide" });
    expect(parseTransactionsCSV(`${HEADER}\n${ok}\n${ok}\nid-3;2024-01-17;Achat`)).toEqual({
      error: "Ligne 4 : 8 colonnes attendues",
    });
    expect(parseTransactionsCSV(`${HEADER}\n${ok.replace("Achat", "Don")}`)).toEqual({
      error: "Ligne 2 : Type invalide",
    });
  });

  it("round-trips: export then import gives back the same transactions", () => {
    const txs = [
      tx(),
      tx({ id: "id-2", type: "Dividende", ticker: "CW8.PA", date: "2024-03-01", quantity: 0, unit_price: 0, total_amount: 12.34, fees: 0 }),
      // Formula-like ticker, and an id that needs quoting (a broken quote parser would shift the columns)
      tx({ id: 'id;"3"', type: "Vente", ticker: "=A1", quantity: 0.1 + 0.2, unit_price: 1234.5678, total_amount: 0.1, fees: 0.07 }),
    ];
    const payloads = txs.map(({ id: _id, created_at: _createdAt, ...payload }) => payload);
    expect(parseTransactionsCSV(transactionsToCSV(txs))).toEqual({ data: payloads });
  });
});
