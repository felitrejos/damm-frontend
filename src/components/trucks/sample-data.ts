import type { Truck } from "./columns";

// Placeholder data — backend endpoint not wired yet.
export const sampleTrucks: Truck[] = [
  { id: 1, code: "TRK-01", plate: "1234 ABC", truck_type: "6pal", capacity_pallets: 6, warehouse_id: 1, active: true },
  { id: 2, code: "TRK-02", plate: "5678 DEF", truck_type: "8pal", capacity_pallets: 8, warehouse_id: 1, active: true },
  { id: 3, code: "TRK-03", plate: "9012 GHI", truck_type: "6pal", capacity_pallets: 6, warehouse_id: 2, active: true },
  { id: 4, code: "TRK-04", plate: "3456 JKL", truck_type: "van", capacity_pallets: 3, warehouse_id: 2, active: true },
  { id: 5, code: "TRK-05", plate: "7890 MNO", truck_type: "8pal", capacity_pallets: 8, warehouse_id: 5, active: true },
  { id: 6, code: "TRK-06", plate: "1357 PQR", truck_type: "6pal", capacity_pallets: 6, warehouse_id: 8, active: true },
];
