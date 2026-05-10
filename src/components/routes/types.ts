// Truck visualization types — what the 3D scene + sidebar consume after
// adapting the backend LoadPlan (see backendLoadAdapter.ts).
//
// Coordinate convention:
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

export type TruckTypeWire = "6pal" | "8pal" | "van";

// Backend product unit. Drives how cases/quantity are labelled in the UI:
//   CAJ -> "cases", BRL -> "barrels", UN -> "units", PAK -> "packs".
export type ProductUnit = "CAJ" | "BRL" | "UN" | "PAK";


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

// Per-stop product line. Mirrors the subset of backend ProductLine that
// matters for the marker/sidebar display: unit/quantity/description.
export interface StopProduct {
  description: string;
  quantity: number;
  unit: string;
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
  products: StopProduct[];
}
