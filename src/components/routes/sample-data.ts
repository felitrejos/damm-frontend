import type { TruckVisualization } from "./types";

// Mock TruckVisualization payloads keyed by truck_type. Backend doesn't expose
// this surface yet — the optimizer's truck-loading visualization endpoint is
// pending. Capacities follow the convention used elsewhere in the UI:
//   van  -> 3 pallets
//   6pal -> 6 pallets
//   8pal -> 8 pallets
type TruckTypeKey = "van" | "6pal" | "8pal";

const TRUCK_DIMS: Record<TruckTypeKey, { length_cm: number; width_cm: number; height_cm: number }> = {
  van: { length_cm: 380, width_cm: 180, height_cm: 200 },
  "6pal": { length_cm: 540, width_cm: 240, height_cm: 240 },
  "8pal": { length_cm: 700, width_cm: 240, height_cm: 240 },
};

const PALLET_BASE = { length_cm: 120, width_cm: 80, height_cm: 15 };

const TRUCK_PALLETS: Record<TruckTypeKey, Array<Parameters<typeof makePallet>[0]>> = {
  van: [
    { idx: 1, x: 40, y: 24, h: 88, color: "#78e7ff", label: "Stop 01", products: ["Beer bottle", "Water"] },
    { idx: 2, x: 170, y: 24, h: 96, color: "#f7c948", label: "Stop 02", products: ["Soft drink"] },
  ],
  "6pal": [
    { idx: 1, x: 32, y: 24, h: 88, color: "#78e7ff", label: "Stop 01", products: ["Beer bottle", "Water"] },
    { idx: 2, x: 166, y: 24, h: 132, color: "#f7c948", label: "Stop 02", products: ["Soft drink", "Coffee"] },
    { idx: 3, x: 300, y: 24, h: 106, color: "#ff6b9a", label: "Stop 03", products: ["Barrel", "Gas"] },
    { idx: 4, x: 32, y: 136, h: 118, color: "#a78bfa", label: "Stop 04", products: ["Wine", "Food"] },
    { idx: 5, x: 300, y: 136, h: 76, isReturn: true, color: "#9ef01a", label: "Return", products: ["Returnables"] },
  ],
  "8pal": [
    { idx: 1, x: 32, y: 24, h: 88, color: "#78e7ff", label: "Stop 01", products: ["Beer bottle", "Water"] },
    { idx: 2, x: 166, y: 24, h: 132, color: "#f7c948", label: "Stop 02", products: ["Soft drink", "Coffee"] },
    { idx: 3, x: 300, y: 24, h: 106, color: "#ff6b9a", label: "Stop 03", products: ["Barrel", "Gas"] },
    { idx: 4, x: 434, y: 24, h: 76, isReturn: true, color: "#9ef01a", label: "Return", products: ["Returnables"] },
    { idx: 5, x: 166, y: 136, h: 118, color: "#a78bfa", label: "Stop 04", products: ["Wine", "Food"] },
    { idx: 6, x: 300, y: 136, h: 96, color: "#ff9f1c", label: "Stop 05", products: ["Dairy", "Disposable"] },
  ],
};

function makePallet(p: {
  idx: number;
  x: number;
  y: number;
  h: number;
  color: string;
  label: string;
  products: string[];
  isReturn?: boolean;
}) {
  return {
    pallet_id: `PAL-${String(p.idx).padStart(3, "0")}`,
    label: p.label,
    color: p.color,
    position: { x: p.x, y: p.y, z: 0 },
    dims: { length_cm: 120, width_cm: 80, height_cm: p.h },
    is_return: Boolean(p.isReturn),
    stop_ids: [`S-${String(p.idx).padStart(3, "0")}`],
    products_summary: p.products,
  };
}

export function buildTruckVisualization(truckType: TruckTypeKey): TruckVisualization {
  const dims = TRUCK_DIMS[truckType];
  return {
    truck_dims: dims,
    pallet_dims: PALLET_BASE,
    pallets: TRUCK_PALLETS[truckType].map(makePallet),
    route_geojson: null,
  };
}
