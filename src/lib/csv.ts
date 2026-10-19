import type { Transaction, TransactionPayload } from "@/lib/types";
import { parseTransaction } from "@/lib/validation";

/**
 * src/lib/csv.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Transactions CSV export / import (French Excel, and the old "," export).
 */

const HEADERS = ["ID", "Date", "Type", "Ticker", "Quantité", "Prix Unitaire", "Montant Total", "Frais"];

/** Text cell: a leading = + - @ would run as a spreadsheet formula, so it gets an apostrophe. */
function textCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const numberCell = (n: number) => String(n).replace(".", ",");

/** CSV for French Excel: BOM (else "QuantitÃ©"), ";" separator, decimal comma, CRLF. */
export function transactionsToCSV(txs: Transaction[]): string {
  const rows = txs.map((tx) =>
    [
      textCell(tx.id),
      textCell(tx.date),
      textCell(tx.type),
      textCell(tx.ticker),
      numberCell(tx.quantity),
      numberCell(tx.unit_price),
      numberCell(tx.total_amount),
      numberCell(tx.fees),
    ].join(";"),
  );
  return "﻿" + [HEADERS.join(";"), ...rows].join("\r\n");
}

/** Splits one CSV line on `sep`, honouring "quoted" cells and "" escapes. */
function splitLine(line: string, sep: string): string[] {
  const cells = [""];
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && quoted && line[i + 1] === '"') {
      cells[cells.length - 1] += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === sep && !quoted) {
      cells.push("");
    } else {
      cells[cells.length - 1] += c;
    }
  }
  return cells;
}

/** "1 234,5" (Excel FR) or "1234.5" → number; an empty cell → `empty`; anything else → NaN. */
function parseNumber(cell: string, empty = NaN): number {
  const compact = cell.replace(/\s/g, "");
  // With a decimal comma, dots are thousands separators ("1.234,56")
  const s = compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact;
  return s ? Number(s) : empty;
}

/**
 * Parses an exported (or Excel-re-saved) CSV; the separator is read from the header line.
 * All or nothing: the first bad row is reported with its real line number.
 */
export function parseTransactionsCSV(
  text: string,
): { data: TransactionPayload[] } | { error: string } {
  const lines = text.replace(/^﻿/, "").split(/\r\n?|\n/);
  const sep = lines[0].includes(";") ? ";" : ",";
  const data: TransactionPayload[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Undo the export's anti-formula apostrophe
    const cols = splitLine(lines[i], sep).map((c) => c.trim().replace(/^'(?=[=+\-@])/, ""));
    if (cols.length < 8) return { error: `Ligne ${i + 1} : 8 colonnes attendues` };

    // Excel FR re-saves ISO dates as dd/mm/yyyy
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cols[1]);
    const parsed = parseTransaction({
      date: dmy ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}` : cols[1],
      type: cols[2],
      ticker: cols[3],
      quantity: parseNumber(cols[4]),
      unit_price: parseNumber(cols[5], 0),
      total_amount: parseNumber(cols[6]),
      fees: parseNumber(cols[7], 0),
    });
    if ("error" in parsed) return { error: `Ligne ${i + 1} : ${parsed.error}` };
    data.push(parsed.data);
  }
  return { data };
}
