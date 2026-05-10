import type { PalletKind, VizPallet } from "./types";

// Three-color visualization palette: one color per cargo kind. The 3D scene
// reads pallet.kind (server-derived) directly — no more regex over product
// names. Each kind has a paired darker `*Edge` shade so adjacent pallets of
// the same kind read as separate boxes.
export const PALLET_COLOR = {
  caseBottle: "#ef4444",
  caseBottleEdge: "#7f1d1d",
  caseCan: "#38bdf8",
  caseCanEdge: "#075985",
  barrel: "#9ca3af",
  barrelEdge: "#374151",
} as const;

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
