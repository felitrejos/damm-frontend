import { adaptTruckLayout } from "./palletAdapter";
import type {
  BackendProduct,
  PalletKind,
  TruckLayout,
  TruckSlot,
  TruckTypeWire,
  TruckVisualization,
} from "./types";

// =============================================================================
// Mock TruckLayout payloads — same shape the backend ships. Run them through
// the adapter to get the `TruckVisualization` that components consume; this
// keeps the demo path identical to the production data path.
// =============================================================================

const PALLET_BASE = {
  length_cm: 120,
  width_cm: 80,
  height_cm: 14.4,
};

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

interface SlotSpec {
  column: number;
  row: number;
  customer_name: string;
  sequence: number | null;
  loaded_height_cm: number;
  kind: PalletKind;
  color: string;
  total_volume_l: number;
  total_weight_kg: number;
  products: BackendProduct[];
  is_return?: boolean;
}

const ESTRELLA_BOTTLE: BackendProduct = {
  material_code: "mat-ed13",
  description: "ESTRELLA DAMM 1/3 RET. PP",
  quantity: 60,
  unit: "CAJ",
};
const ESTRELLA_CAN: BackendProduct = {
  material_code: "mat-ed13lt",
  description: "ESTRELLA DAMM LATA 33CL",
  quantity: 99,
  unit: "CAJ",
};
const FREE_DAMM: BackendProduct = {
  material_code: "mat-fd25",
  description: "FREE DAMM 25CL",
  quantity: 70,
  unit: "CAJ",
};
const KEG_50L: BackendProduct = {
  material_code: "mat-keg50",
  description: "BARRIL ESTRELLA 50L",
  quantity: 4,
  unit: "BRL",
};
const PET_15L: BackendProduct = {
  material_code: "mat-pet15",
  description: "AGUA VELERIA PET 1.5L",
  quantity: 80,
  unit: "CAJ",
};

const TRUCK_SLOT_SPECS: Record<TruckTypeWire, SlotSpec[]> = {
  van: [
    {
      column: 0, row: 1, sequence: 1,
      customer_name: "BAR LA GRALLA",
      loaded_height_cm: 169, kind: "case-bottle",
      color: "#0891b2",
      total_volume_l: 17.1, total_weight_kg: 195,
      products: [ESTRELLA_BOTTLE],
    },
    {
      column: 0, row: 2, sequence: 2,
      customer_name: "RSTE. L'OLIVE",
      loaded_height_cm: 144, kind: "case-can",
      color: "#16a34a",
      total_volume_l: 32.7, total_weight_kg: 230,
      products: [ESTRELLA_CAN],
    },
  ],
  "6pal": [
    {
      column: 0, row: 1, sequence: 1,
      customer_name: "RESTAURANTE EUROPEO CONGOST",
      loaded_height_cm: 169, kind: "case-bottle",
      color: "#2563eb",
      total_volume_l: 17.1, total_weight_kg: 195,
      products: [ESTRELLA_BOTTLE],
    },
    {
      column: 1, row: 1, sequence: 2,
      customer_name: "BAR STACJA PL",
      loaded_height_cm: 144, kind: "case-can",
      color: "#f97316",
      total_volume_l: 32.7, total_weight_kg: 230,
      products: [ESTRELLA_CAN],
    },
    {
      column: 0, row: 2, sequence: 3,
      customer_name: "EL TIRO DE GRANOLLERS",
      loaded_height_cm: 165, kind: "barrel",
      color: "#dc2626",
      total_volume_l: 200, total_weight_kg: 320,
      products: [KEG_50L],
    },
    {
      column: 1, row: 2, sequence: 4,
      customer_name: "CA LA SETE",
      loaded_height_cm: 178, kind: "case-bottle",
      color: "#7c3aed",
      total_volume_l: 28.4, total_weight_kg: 410,
      products: [ESTRELLA_BOTTLE, FREE_DAMM],
    },
    {
      column: 0, row: 3, sequence: 5,
      customer_name: "BAR LA GRALLA",
      loaded_height_cm: 152, kind: "case-bottle",
      color: "#0891b2",
      total_volume_l: 12.4, total_weight_kg: 195,
      products: [PET_15L],
    },
  ],
  "8pal": [
    {
      column: 0, row: 1, sequence: 1,
      customer_name: "RESTAURANTE EUROPEO CONGOST",
      loaded_height_cm: 169, kind: "case-bottle",
      color: "#2563eb",
      total_volume_l: 17.1, total_weight_kg: 195,
      products: [ESTRELLA_BOTTLE],
    },
    {
      column: 1, row: 1, sequence: 2,
      customer_name: "RSTE. L'OLIVE",
      loaded_height_cm: 144, kind: "case-can",
      color: "#16a34a",
      total_volume_l: 45, total_weight_kg: 262.5,
      products: [ESTRELLA_CAN],
    },
    {
      column: 0, row: 2, sequence: 3,
      customer_name: "BAR STACJA PL",
      loaded_height_cm: 165, kind: "barrel",
      color: "#f97316",
      total_volume_l: 200, total_weight_kg: 320,
      products: [KEG_50L],
    },
    {
      column: 1, row: 2, sequence: 4,
      customer_name: "CA LA SETE",
      loaded_height_cm: 178, kind: "case-bottle",
      color: "#7c3aed",
      total_volume_l: 45, total_weight_kg: 705,
      products: [ESTRELLA_BOTTLE, FREE_DAMM],
    },
    {
      column: 0, row: 3, sequence: 5,
      customer_name: "EL TIRO DE GRANOLLERS",
      loaded_height_cm: 152, kind: "case-bottle",
      color: "#dc2626",
      total_volume_l: 26, total_weight_kg: 380,
      products: [PET_15L],
    },
    {
      column: 1, row: 3, sequence: 6,
      customer_name: "BAR LA GRALLA",
      loaded_height_cm: 144, kind: "case-can",
      color: "#0891b2",
      total_volume_l: 32.7, total_weight_kg: 230,
      products: [ESTRELLA_CAN, FREE_DAMM],
    },
  ],
};

function specToSlot(spec: SlotSpec, idx: number): TruckSlot {
  return {
    pallet_id: `PAL-${String(idx).padStart(3, "0")}`,
    column: spec.column,
    row: spec.row,
    customer_name: spec.customer_name,
    sequence: spec.sequence,
    stop_id: `plan-${spec.sequence ?? "ret"}-${idx}`,
    is_empty: false,
    is_return: Boolean(spec.is_return),
    color: spec.color,
    loaded_height_cm: spec.loaded_height_cm,
    kind: spec.kind,
    total_volume_l: spec.total_volume_l,
    total_weight_kg: spec.total_weight_kg,
    products: spec.products,
  };
}

export function buildTruckLayout(truckType: TruckTypeWire): TruckLayout {
  const grid = TRUCK_GRID[truckType];
  const slots = TRUCK_SLOT_SPECS[truckType].map((spec, i) =>
    specToSlot(spec, i + 1),
  );
  return {
    truck_type: truckType,
    rows: grid.rows,
    columns: grid.columns,
    pallet_dims_cm: PALLET_BASE,
    truck_dims_cm: grid.truck_dims,
    total_slots: grid.rows * grid.columns,
    used_slots: slots.length,
    return_slots: 0,
    slots,
    return_pallet: null,
  };
}

export function buildTruckVisualization(
  truckType: TruckTypeWire,
): TruckVisualization {
  return adaptTruckLayout(buildTruckLayout(truckType));
}

// Convenience: previous default used by /preview/route/[id] before review
// feedback. Kept for tests that import the symbol directly; production
// flow should go through buildTruckVisualization(truckType).
export const sampleTruckVisualization: TruckVisualization =
  buildTruckVisualization("8pal");
