// Truck visualization types.
// Two layers:
//   - Wire types (TruckLayout, TruckSlot, BackendProduct): exact shape the
//     backend ships. Mirrors api-contract / damm-backend domain model.
//   - Domain types (TruckVisualization, VizPallet, Product): what the React
//     components consume. Position is derived from grid coords; field names
//     are normalized for the UI.
// Adapter: see palletAdapter.ts (adaptTruckLayout).
//
// Coordinate convention (domain side):
//   Origin = front-left-floor corner of cargo area.
//   x = truck length (0 = front), y = width, z = height. Units in centimeters.

export interface DimensionsCm {
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

export interface PositionCm {
  x: number;
  y: number;
  z: number;
}

export type PalletKind = "case-bottle" | "case-can" | "barrel";

// =============================================================================
// Wire types — match the backend payload exactly. Don't rename fields here.
// =============================================================================

export type TruckTypeWire = "6pal" | "8pal" | "van";

// Backend product unit. Drives how cases/quantity are labelled in the UI:
//   CAJ -> "cases", BRL -> "barrels", UN -> "units", PAK -> "packs".
export type ProductUnit = "CAJ" | "BRL" | "UN" | "PAK";

export interface BackendProduct {
  // Currently a UUID material code. The backend may add a short SKU column
  // later; for now this is the only stable identifier.
  material_code: string;
  description: string;
  // Quantity in `unit`. For CAJ this is cases; for BRL barrels; etc.
  quantity: number;
  unit: ProductUnit;
}

export interface TruckSlot {
  pallet_id: string;
  column: number; // 0..columns-1
  row: number; // 1-indexed (1 = nearest cabin)
  customer_name: string;
  // Stop sequence on the route. null for returnable / non-customer slots.
  sequence: number | null;
  stop_id: string;

  is_empty: boolean;
  is_return: boolean;
  color: string;

  // Total height including the wooden base (~14.4 cm). Empty pallets
  // come back as base-only height.
  loaded_height_cm: number;
  kind: PalletKind;

  total_volume_l: number;
  total_weight_kg: number;
  products: BackendProduct[];
}

export interface TruckLayout {
  truck_type: TruckTypeWire;
  rows: number;
  columns: number;
  pallet_dims_cm: DimensionsCm;
  truck_dims_cm: DimensionsCm;
  total_slots: number;
  used_slots: number;
  return_slots: number;
  slots: TruckSlot[];
  // Returnable consolidated pallet, separate from the slots grid. Ignored
  // by the v1 frontend but kept here so the wire type stays faithful.
  return_pallet?: TruckSlot | null;
}

// =============================================================================
// Domain types — what the React components consume. Field names are
// normalized for the UI; positions derived from grid coords.
// =============================================================================

export interface Product {
  // Stable id from the backend (currently material_code UUID; may become a
  // short SKU later). Use as React key, not for display.
  sku: string;
  name: string;
  // Quantity in `unit`. For CAJ this is cases; for BRL barrels; etc.
  cases: number;
  unit: ProductUnit;
}

export interface VizPallet {
  pallet_id: string;
  customer_name: string;
  // Stop ordering on the route. null for returnable / non-customer slots.
  sequence: number | null;
  // Hex color, mostly used as fallback in the sidebar swatch — the 3D scene
  // colors by `kind`.
  color: string;
  position: PositionCm;
  dims: DimensionsCm;
  kind: PalletKind;
  is_empty: boolean;
  is_return: boolean;
  total_volume_l: number;
  total_weight_kg: number;
  products: Product[];
}

export interface TruckVisualization {
  truck_dims: DimensionsCm;
  pallet_dims: DimensionsCm;
  pallets: VizPallet[];
  route_geojson: Record<string, unknown> | null;
}

// =============================================================================
// Route stops — used by the map / review panels (kept as in dev).
// Mirrors `wiki/contracts/data-models.md` -> DeliveryStop and damm-backend
// `models/domain.py:DeliveryStop`. Times are "HH:MM" 24h strings (matches
// backend `time` serialization).
// =============================================================================

export interface TimeWindow {
  open: string;
  close: string;
}

export interface RouteStop {
  stop_id: string;
  sequence: number;
  customer_id: string;
  customer_name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  time_window: TimeWindow | null;
  estimated_arrival: string | null;
  service_time_min: number;
}
