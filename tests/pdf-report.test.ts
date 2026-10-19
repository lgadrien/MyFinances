import { describe, it, expect } from "vitest";
import { formatPdfEUR } from "@/lib/pdf-report";
import { useSettingsStore } from "@/stores/useSettingsStore";

describe("Fiscal PDF", () => {
  it("formats amounts with ASCII spaces only, real amount even in privacy mode", () => {
    useSettingsStore.setState({ privacyMode: true });
    // fr-FR uses U+202F / U+00A0, which jsPDF's Helvetica cannot encode
    expect(formatPdfEUR(12345.67)).toBe("12 345,67 €");
  });
});
