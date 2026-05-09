// Truck visualization frontend types.
// Mirrors `wiki/contracts/data-models.md` -> TruckVisualization / VizPallet.
// Coordinate convention (per contract):
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

export interface VizPallet {
  pallet_id: string;
  label: string;
  color: string;
  position: PositionCm;
  dims: DimensionsCm;
  is_return: boolean;
  stop_ids: string[];
  products_summary: string[];
}

export interface TruckVisualization {
  truck_dims: DimensionsCm;
  pallet_dims: DimensionsCm;
  pallets: VizPallet[];
  route_geojson: Record<string, unknown> | null;
}

// Mirrors `wiki/contracts/data-models.md` -> DeliveryStop and damm-backend
// `models/domain.py:DeliveryStop`. Times are "HH:MM" 24h strings (matches
// backend `time` serialization).
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

