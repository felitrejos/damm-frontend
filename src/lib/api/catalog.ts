import { z } from "zod";
import { fetchJson } from "./client";

// Backend shapes mirror /api/v1/db/{trucks,customers,drivers}. IDs and FK
// references are UUID strings, not numbers.

export const Truck = z.object({
  id: z.string(),
  plate: z.string().nullable().optional(),
  capacity_pallets: z.number(),
  warehouse_id: z.string().nullable().optional(),
});
export type Truck = z.infer<typeof Truck>;

export const Customer = z.object({
  id: z.string(),
  name: z.string(),
  name_2: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  // zone_code is opaque (e.g. "DD13100050") and shown nowhere directly, but
  // it's used to cluster optimizer-suggested stops by zone in AddRouteModal.
  zone_code: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});
export type Customer = z.infer<typeof Customer>;

export const Driver = z.object({
  id: z.string(),
  name: z.string(),
});
export type Driver = z.infer<typeof Driver>;

// Convenience: derive a display label for truck type from pallet capacity.
// Backend doesn't store this — UI groups/filters by it.
export function truckTypeFor(capacityPallets: number): "van" | "6pal" | "8pal" {
  if (capacityPallets <= 3) return "van";
  if (capacityPallets <= 6) return "6pal";
  return "8pal";
}

export function listTrucks(): Promise<Truck[]> {
  return fetchJson("/api/v1/db/trucks?limit=10000", z.array(Truck));
}

export function listCustomers(): Promise<Customer[]> {
  return fetchJson("/api/v1/db/customers?limit=10000", z.array(Customer));
}

export function listDrivers(): Promise<Driver[]> {
  return fetchJson("/api/v1/db/drivers?limit=10000", z.array(Driver));
}
