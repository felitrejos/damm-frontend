import type { PalletKind, VizPallet } from "./types";

// Three-color visualization palette: one color per cargo kind. The 3D scene
// reads pallet.kind (server-derived) directly — no more regex over product
// names. Each kind has a paired darker `*Edge` shade so adjacent pallets of
// the same kind read as separate boxes.
//
// Kept as a fallback for callers that still think in terms of kind. The 3D
// scene now keys partition color off the product `unit` via UNIT_PALETTE
// below, which is the source of truth.
export const PALLET_COLOR = {
  caseBottle: "#ef4444",
  caseBottleEdge: "#7f1d1d",
  caseCan: "#38bdf8",
  caseCanEdge: "#075985",
  barrel: "#9ca3af",
  barrelEdge: "#374151",
} as const;

// One color per backend product unit. Each pallet partition (a contiguous
// strip of the pallet base hosting products of one unit) uses the matching
// fill+edge shade. Edges are a noticeably darker variant so adjacent strips
// read as separate boxes against the truck's wireframe.
export const UNIT_PALETTE: Record<string, { fill: string; edge: string }> = {
  CAJ: { fill: "#ef4444", edge: "#7f1d1d" }, // standard case — red
  ZPR: { fill: "#ef4444", edge: "#7f1d1d" }, // alias for CAJ
  UN:  { fill: "#f97316", edge: "#9a3412" }, // 1/5 case — orange
  BOT: { fill: "#eab308", edge: "#854d0e" }, // 1/10 case — yellow
  BRL: { fill: "#9ca3af", edge: "#374151" }, // barrel — gray (matches legacy)
  PAK: { fill: "#38bdf8", edge: "#075985" }, // pack — blue
  EST: { fill: "#a855f7", edge: "#581c87" }, // display-box — violet
  TB:  { fill: "#a3e635", edge: "#3f6212" }, // tube/small — lime
  BID: { fill: "#06b6d4", edge: "#155e75" }, // bidon — cyan
  PQ:  { fill: "#ec4899", edge: "#831843" }, // small packet — pink
  KG:  { fill: "#a16207", edge: "#451a03" }, // bulk weight — brown
};

const UNIT_FALLBACK = UNIT_PALETTE.CAJ!;

export function paletteForUnit(unit: string): { fill: string; edge: string } {
  return UNIT_PALETTE[unit.toUpperCase()] ?? UNIT_FALLBACK;
}

export function palletDisplayColor(pallet: VizPallet): string {
  return colorForKind(pallet.kind);
}

export function colorForKind(kind: PalletKind): string {
  switch (kind) {
    case "barrel":
      return PALLET_COLOR.barrel;
    case "case-can":
      return PALLET_COLOR.caseCan;
    case "case-bottle":
    default:
      return PALLET_COLOR.caseBottle;
  }
}

export function edgeForKind(kind: PalletKind): string {
  switch (kind) {
    case "barrel":
      return PALLET_COLOR.barrelEdge;
    case "case-can":
      return PALLET_COLOR.caseCanEdge;
    case "case-bottle":
    default:
      return PALLET_COLOR.caseBottleEdge;
  }
}

// Visual stack-height multiplier per kind so cans (lata) read as ~80% the
// height of a bottle pallet of the same data height — matching the ZM040
// reference (ED13 1.69 m vs ED13LT 1.44 m → ~0.85). Bottles and barrels
// stay at 1.0.
export function heightFactorForKind(kind: PalletKind): number {
  return kind === "case-can" ? 0.8 : 1;
}
