import type { Route } from "./columns";
import type { TruckVisualization } from "./types";

// Placeholder route list — keyed by `centerId` so each center shows its own
// routes. Backend `RouteResult` endpoint not wired here yet (see
// wiki/contracts/api-contract.md and data-models.md).
export const sampleRoutes: Route[] = [
  // Barcelona Norte (centerId 1)
  { id: 101, code: "R-01-A", driver_name: "Marc Vidal", truck_code: "TRK-01", stops: 14, date: "2026-05-09", centerId: 1 },
  { id: 102, code: "R-01-B", driver_name: "Sara López", truck_code: "TRK-02", stops: 11, date: "2026-05-09", centerId: 1 },
  { id: 103, code: "R-01-C", driver_name: "David Martí", truck_code: "TRK-04", stops: 8, date: "2026-05-09", centerId: 1 },
  // Barcelona Sur (centerId 2)
  { id: 201, code: "R-02-A", driver_name: "Anna Costa", truck_code: "TRK-03", stops: 12, date: "2026-05-09", centerId: 2 },
  { id: 202, code: "R-02-B", driver_name: "Pere Mas", truck_code: "TRK-04", stops: 9, date: "2026-05-09", centerId: 2 },
  // Tarragona (centerId 3)
  { id: 301, code: "R-03-A", driver_name: "Núria Soler", truck_code: "TRK-03", stops: 7, date: "2026-05-09", centerId: 3 },
  // Lleida (centerId 4)
  { id: 401, code: "R-04-A", driver_name: "Jordi Vila", truck_code: "TRK-04", stops: 5, date: "2026-05-09", centerId: 4 },
  // Valencia (centerId 5)
  { id: 501, code: "R-05-A", driver_name: "Marc Vidal", truck_code: "TRK-05", stops: 12, date: "2026-05-09", centerId: 5 },
  { id: 502, code: "R-05-B", driver_name: "Laura Gómez", truck_code: "TRK-06", stops: 8, date: "2026-05-09", centerId: 5 },
  // Madrid Norte (centerId 8)
  { id: 801, code: "R-08-A", driver_name: "Sara López", truck_code: "TRK-06", stops: 16, date: "2026-05-09", centerId: 8 },
  { id: 802, code: "R-08-B", driver_name: "Anna Costa", truck_code: "TRK-05", stops: 13, date: "2026-05-09", centerId: 8 },
  { id: 803, code: "R-08-C", driver_name: "Pere Mas", truck_code: "TRK-01", stops: 10, date: "2026-05-09", centerId: 8 },
  // Madrid Sur (centerId 9)
  { id: 901, code: "R-09-A", driver_name: "Núria Soler", truck_code: "TRK-02", stops: 13, date: "2026-05-09", centerId: 9 },
];

// Mock TruckVisualization payloads keyed by truck_type. Conforms to the
// `TruckVisualization` shape from wiki/contracts/data-models.md so the real
// backend payload will drop in unchanged.
//
// Capacities follow sampleTrucks in src/components/trucks/sample-data.ts:
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

// Pre-defined pallet placements per truck type — covers ~75% of capacity so
// the load looks realistic (not empty, not overfilled). Position is the
// front-left-floor corner of each pallet in the cargo area.
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

// Convenience: previous default used by /preview/route/[id] before review
// feedback. Kept for tests that import the symbol directly; production
// flow should go through buildTruckVisualization(truckType).
export const sampleTruckVisualization: TruckVisualization = buildTruckVisualization("8pal");
