import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EnrichedPortfolioPosition } from "@/hooks/usePortfolio";
import { formatEUR, formatPercent } from "./utils";

export interface FiscalReportData {
  totalValue: number;
  totalInvested: number;
  totalPV: number;
  totalDividends: number;
  cashBalance: number;
  positions: EnrichedPortfolioPosition[];
  year?: number;
}

export function generateFiscalReportPDF(data: FiscalReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const year = data.year || new Date().getFullYear();
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalCapital = data.totalValue + data.cashBalance;
  const taxableGain = Math.max(0, data.totalPV);
  const socialTaxes = taxableGain * 0.172;
  const netValueIfLiquidated = totalCapital - socialTaxes;

  // ── Palette de couleurs moderne ──
  const primary = [109, 40, 217]; // Violet #6D28D9
  const dark = [24, 24, 27]; // Zinc 900
  const textGray = [113, 113, 122]; // Zinc 500
  const lightBg = [244, 244, 245]; // Zinc 100

  // ── 1. En-tête du document ──
  doc.setFillColor(dark[0], dark[1], dark[2]);
  doc.rect(0, 0, 210, 32, "F");

  // Logo / Titre
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MyFinances", 14, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(196, 181, 253);
  doc.text("RAPPORT FISCAL & SYNTHÈSE PATRIMONIALE PEA", 14, 22);

  doc.setTextColor(161, 161, 170);
  doc.setFontSize(8);
  doc.text(`Édité le ${dateStr} • Année ${year}`, 14, 27);

  // Badge officiel
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.roundedRect(145, 10, 50, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PEA BANCAIRE 🇫🇷", 152, 17.5);

  // ── 2. Cadre Synthèse Patrimoniale ──
  let y = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("1. Synthèse Globale du Portefeuille", 14, y);

  y += 6;
  const colW = 44;
  const kpis = [
    { label: "Valorisation Totale", value: formatEUR(totalCapital), color: primary },
    { label: "Total Investi (PRU)", value: formatEUR(data.totalInvested), color: dark },
    {
      label: "Plus-Value Latente",
      value: (data.totalPV >= 0 ? "+" : "") + formatEUR(data.totalPV),
      color: data.totalPV >= 0 ? [16, 185, 129] : [239, 68, 68],
    },
    { label: "Dividendes Cumulés", value: formatEUR(data.totalDividends), color: [16, 185, 129] },
  ];

  kpis.forEach((kpi, i) => {
    const x = 14 + i * (colW + 4);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(x, y, colW, 18, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(kpi.label, x + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, y + 14);
  });

  // ── 3. Cadre Estimation Fiscale (Règles PEA) ──
  y += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("2. Estimation Fiscale & Prélèvements Sociaux", 14, y);

  y += 6;
  doc.setFillColor(250, 245, 255); // Violet très clair
  doc.setDrawColor(221, 214, 254);
  doc.roundedRect(14, y, 182, 28, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(dark[0], dark[1], dark[2]);

  doc.text("• Régime fiscal applicable :", 18, y + 7);
  doc.setFont("helvetica", "bold");
  doc.text("Exonération d'impôt sur le revenu après 5 ans (seuls les prélèvements sociaux s'appliquent).", 62, y + 7);

  doc.setFont("helvetica", "normal");
  doc.text(`• Assiette imposable estimée (Plus-Value Globale) : `, 18, y + 13);
  doc.setFont("helvetica", "bold");
  doc.text(formatEUR(taxableGain), 95, y + 13);

  doc.setFont("helvetica", "normal");
  doc.text(`• Prélèvements Sociaux applicables (taux forfaitaire 17.2%) : `, 18, y + 19);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68);
  doc.text(`- ${formatEUR(socialTaxes)}`, 105, y + 19);

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont("helvetica", "normal");
  doc.text(`• Valeur Nette après liquidation intégrale estimée : `, 18, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(formatEUR(netValueIfLiquidated), 92, y + 25);

  // ── 4. Tableau d'Inventaire Détaillé des Positions ──
  y += 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("3. Inventaire Détaillé des Actifs en Portefeuille", 14, y);

  const tableBody = data.positions.map((p) => {
    const perf = p.totalInvested > 0 ? (p.plusValue || 0) / p.totalInvested : 0;
    return [
      p.ticker,
      p.name || p.ticker,
      p.sector || "Autre",
      p.totalQuantity.toFixed(2),
      formatEUR(p.pru),
      p.currentPrice ? formatEUR(p.currentPrice) : "—",
      p.capitalValue ? formatEUR(p.capitalValue) : "—",
      `${(p.plusValue || 0) >= 0 ? "+" : ""}${formatEUR(p.plusValue || 0)} (${formatPercent(perf)})`,
      formatEUR(p.dividends || 0),
    ];
  });

  autoTable(doc, {
    startY: y + 4,
    head: [
      [
        "Ticker",
        "Société",
        "Secteur",
        "Qté",
        "PRU",
        "Cours",
        "Valorisation",
        "+/- Value",
        "Dividendes",
      ],
    ],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      halign: "left",
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [39, 39, 42],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { cellWidth: 36 },
      2: { cellWidth: 22 },
      3: { halign: "right", cellWidth: 14 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "right", cellWidth: 18 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 20 },
      7: { halign: "right", cellWidth: 22 },
      8: { halign: "right", cellWidth: 16 },
    },
    didDrawPage: (hookData) => {
      // Footer sur chaque page
      const pageNumber = hookData.pageNumber;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text(
        `Document généré automatiquement par MyFinances PEA Tracker • Page ${pageNumber} • Données non contractuelles à des fins indicatives.`,
        14,
        290,
      );
    },
  });

  // Sauvegarder le document PDF
  const filename = `MyFinances_Rapport_Fiscal_${year}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
