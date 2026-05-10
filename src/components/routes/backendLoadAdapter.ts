// Adapter: backend LoadPlan.pallets[] -> frontend TruckVisualization.
//
// The backend doesn't fill `position_in_truck` and reports total_height_cm/
// total_weight_kg as 0 in this dataset, so geometry is derived client-side
// from `pallet_index` + the truck-type's grid. Real product data
// (descriptions, quantities, units) flows through unchanged.

import type { PersistedLoadPlan, PersistedPallet, PersistedProduct } from "@/lib/api/transports";

import type {
  PalletKind,
  Product,
  TruckTypeWire,
  TruckVisualization,
  VizPallet,
} from "./types";

const PALLET_BASE = { length_cm: 120, width_cm: 80, height_cm: 14.4 };

// Same grid the mock builder uses — kept here in sync so backend and mock
// renderings line up dimensionally.
const TRUCK_GRID: Record<
  TruckTypeWire,
  { rows: number; columns: number; truck_dims: typeof PALLET_BASE }
> = {
  van: {
    rows: 3,
    columns: 1,
    truck_dims: { length_cm: 380, width_cm: 180, height_cm: 220 },
  },
  "6pal": {
    rows: 3,
    columns: 2,
    truck_dims: { length_cm: 360, width_cm: 240, height_cm: 240 },
  },
  "8pal": {
    rows: 4,
    columns: 2,
    truck_dims: { length_cm: 480, width_cm: 240, height_cm: 240 },
  },
};

// Loaded pallet height when backend reports 0 — picked to look reasonable
// against the truck cargo height (240 cm) without poking through the roof.
const DEFAULT_LOADED_HEIGHT_CM = 144;

// Per-unit footprint factor: how many "pallet slots" one unit of quantity
// consumes. CAJ is the reference (1 slot). Source: catalog tally the user
// shared (CAJ 1.0, UN 0.2, BRL 4.0, BOT 0.1, TB 0.8, ZPR 1.0, PAK 1.0,
// EST 1.0, BID 1.5, PQ 0.8, KG 1.0). Unknown units default to 1.
const UNIT_FOOTPRINT: Record<string, number> = {
  CAJ: 1.0,
  ZPR: 1.0,
  PAK: 1.0,
  EST: 1.0,
  KG:  1.0,
  UN:  0.2,
  BOT: 0.1,
  TB:  0.8,
  PQ:  0.8,
  BID: 1.5,
  BRL: 4.0,
};

// One layer of a typical case is ~24 cm tall. A 6-slot layer fits on a
// standard EUR pallet. So a pallet with `slotsTotal` units climbs by
// ceil(slots/SLOTS_PER_LAYER) layers, each LAYER_HEIGHT_CM tall, capped at
// DEFAULT_LOADED_HEIGHT_CM so visuals don't poke through the roof.
const SLOTS_PER_LAYER = 6;
const LAYER_HEIGHT_CM = 24;

function deriveStackHeightCm(products: PersistedProduct[]): number {
  if (products.length === 0) return DEFAULT_LOADED_HEIGHT_CM;
  const slots = products.reduce(
    (sum, p) => sum + p.quantity * (UNIT_FOOTPRINT[p.unit?.toUpperCase() ?? ""] ?? 1),
    0,
  );
  if (slots <= 0) return DEFAULT_LOADED_HEIGHT_CM;
  const layers = Math.max(1, Math.ceil(slots / SLOTS_PER_LAYER));
  return Math.min(DEFAULT_LOADED_HEIGHT_CM, layers * LAYER_HEIGHT_CM);
}

function normalizeTruckType(value: string | null | undefined): TruckTypeWire {
  if (value === "van" || value === "6pal" || value === "8pal") return value;
  return "8pal";
}

// Row-major fill: pallet_index 0 -> (col 0, row 1), 1 -> (col 1, row 1),
// 2 -> (col 0, row 2)... mirrors how the backend's left/right truck_layout
// numbers slots, and matches the existing 3D scene geometry.
function gridPosition(
  index: number,
  columns: number,
  palletDims: typeof PALLET_BASE,
): { x: number; y: number; z: number } {
  const col = index % columns;
  const row = Math.floor(index / columns) + 1;
  return {
    x: (row - 1) * palletDims.length_cm,
    y: col * palletDims.width_cm,
    z: 0,
  };
}

function emptyAt(
  index: number,
  columns: number,
  palletDims: typeof PALLET_BASE,
): VizPallet {
  const col = index % columns;
  const row = Math.floor(index / columns) + 1;
  return {
    pallet_id: `EMPTY-${col}-${row}`,
    customer_name: "",
    sequence: null,
    color: "#000000",
    position: gridPosition(index, columns, palletDims),
    dims: { ...palletDims },
    kind: "case-bottle",
    is_empty: true,
    is_return: false,
    total_volume_l: 0,
    total_weight_kg: 0,
    products: [],
  };
}

// Pallet kind drives the 3D scene's color and stack-height multiplier. We
// guess from the dominant product:
//   unit BRL                          -> barrel
//   category mentions "can" / "lata"  -> case-can
//   anything else                     -> case-bottle
function inferKind(products: PersistedProduct[]): PalletKind {
  if (products.length === 0) return "case-bottle";
  const head = products[0]!;
  if ((head.unit ?? "").toUpperCase() === "BRL") return "barrel";
  const cat = (head.category ?? "").toLowerCase();
  if (cat.includes("can") || cat.includes("lata")) return "case-can";
  return "case-bottle";
}

const KNOWN_UNITS: ReadonlySet<Product["unit"]> = new Set([
  "CAJ", "BRL", "UN", "PAK", "BOT", "TB", "ZPR", "EST", "BID", "PQ", "KG",
]);

function normalizeUnit(value: string): Product["unit"] {
  const v = value.toUpperCase() as Product["unit"];
  return KNOWN_UNITS.has(v) ? v : "CAJ";
}

function toUiProduct(p: PersistedProduct): Product {
  return {
    sku: p.material_code,
    name: p.description ?? p.material_code,
    cases: p.quantity,
    unit: normalizeUnit(p.unit),
  };
}

function palletToViz(
  pallet: PersistedPallet,
  index: number,
  columns: number,
): VizPallet {
  // Prefer the backend's reported height when present (>1 cm). Backend
  // currently emits 0 here, so most of the time we fall back to a height
  // derived from the products on the pallet — keeps few-unit pallets short
  // (single thin layer) instead of all rendering at the constant 144 cm.
  const heightSource = pallet.total_height_cm ?? 0;
  const loaded_height_cm =
    heightSource > 1 ? heightSource : deriveStackHeightCm(pallet.products);

  return {
    pallet_id: pallet.pallet_id,
    // No single customer per pallet (semantically multi-stop) — leave blank
    // and let the card UI surface the products instead.
    customer_name: "",
    // First stop's sequence on the route. Surfacing only the first when
    // multiple stops share a pallet is a small white lie — acceptable until
    // the UI grows multi-stop badges.
    sequence: pallet.stop_ids.length > 0 ? index + 1 : null,
    color: "#000000", // unused — palletDisplayColor reads .kind
    position: gridPosition(index, columns, PALLET_BASE),
    dims: {
      length_cm: PALLET_BASE.length_cm,
      width_cm: PALLET_BASE.width_cm,
      height_cm: loaded_height_cm,
    },
    kind: inferKind(pallet.products),
    is_empty: false,
    is_return: pallet.is_returnables,
    total_volume_l: pallet.total_volume_l ?? 0,
    total_weight_kg: 0,
    products: pallet.products.map(toUiProduct),
  };
}

export function adaptBackendLoadPlan(
  load: PersistedLoadPlan,
): TruckVisualization {
  const truckType = normalizeTruckType(load.truck_type);
  const grid = TRUCK_GRID[truckType];
  const totalSlots = grid.rows * grid.columns;

  // Sort by pallet_index so the grid fill is stable when backend returns
  // pallets out of order.
  const real = [...load.pallets]
    .filter((p) => !p.is_returnables)
    .sort((a, b) => a.pallet_index - b.pallet_index)
    .slice(0, totalSlots)
    .map((p, i) => palletToViz(p, i, grid.columns));

  const filled = new Set(real.map((p) => `${p.position.x},${p.position.y}`));
  const empties: VizPallet[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const pos = gridPosition(i, grid.columns, PALLET_BASE);
    if (filled.has(`${pos.x},${pos.y}`)) continue;
    empties.push(emptyAt(i, grid.columns, PALLET_BASE));
  }

  return {
    truck_dims: grid.truck_dims,
    pallet_dims: PALLET_BASE,
    pallets: [...real, ...empties],
    route_geojson: null,
  };
}
