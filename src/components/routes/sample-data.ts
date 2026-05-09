import type { Route } from "./columns";

// Placeholder data — keyed by `centerId` so each center shows its own routes.
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
