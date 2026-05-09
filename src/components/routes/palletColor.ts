import type { VizPallet } from "./types";

// Three-color visualization palette: one color per cargo unit kind. Backend
// pallet.color is intentionally ignored at render time so the load reads at a
// glance ("yellow = bottle cases, blue = cans, red = barrels"). When real
// `RouteResult` payloads arrive we still classify by the products_summary;
// later the backend can ship a category field and this helper goes away.
export const PALLET_COLOR = {
  caseBottle: "#f7c948",
  caseCan: "#38bdf8",
  barrel: "#ef4444",
} as const;

export type PalletItemKind = "case-bottle" | "case-can" | "barrel" | null;

export function detectPalletItemKind(pallet: VizPallet): PalletItemKind {
  if (pallet.is_return) return null;
  const s = pallet.products_summary.join(" ").toLowerCase();
  if (/barrel|barril|gas/.test(s)) return "barrel";
  if (/can|lat[ae]|soft\s*drink/.test(s)) return "case-can";
  return "case-bottle";
}

export function palletDisplayColor(pallet: VizPallet): string {
  const kind = detectPalletItemKind(pallet);
  switch (kind) {
    case "barrel":
      return PALLET_COLOR.barrel;
    case "case-can":
      return PALLET_COLOR.caseCan;
    default:
      // Returnables (kind === null) and bottle cases share the standard color.
      return PALLET_COLOR.caseBottle;
  }
}
