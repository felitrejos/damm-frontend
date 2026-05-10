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

export const MaterialType = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type MaterialType = z.infer<typeof MaterialType>;

export const Material = z.object({
  id: z.string(),
  description: z.string(),
  base_unit: z.string().nullable().optional(),
  material_type_id: z.string().nullable().optional(),
  is_returnable: z.boolean().optional(),
});
export type Material = z.infer<typeof Material>;

export function listMaterials(): Promise<Material[]> {
  return fetchJson("/api/v1/catalog/materials", z.array(Material));
}

export function listMaterialTypes(): Promise<MaterialType[]> {
  return fetchJson("/api/v1/catalog/material-types", z.array(MaterialType));
}

// ----- Drivers with familiar zones (data router, derived from history) -----

export const DriverZoneStat = z.object({
  zone_code: z.string(),
  visits: z.number(),
});
export type DriverZoneStat = z.infer<typeof DriverZoneStat>;

export const DriverWithZones = z.object({
  id: z.string(),
  name: z.string(),
  top_zones: z.array(DriverZoneStat).default([]),
  total_visits: z.number().default(0),
});
export type DriverWithZones = z.infer<typeof DriverWithZones>;

export function listDriversWithZones(): Promise<DriverWithZones[]> {
  return fetchJson("/api/v1/data/drivers", z.array(DriverWithZones));
}

// ----- Catalog mutations (CRUD) -----
//
// Creates use the /catalog endpoints when they exist (auto-geocoding for
// customers/warehouses, etc.). Updates and deletes go through the generic
// /db/{table}/{id} CRUD because no behavioural difference is needed.

export type CustomerCreate = {
  name: string;
  name_2?: string;
  address?: string;
  postal_code?: string;
  city?: string;
};
export type CustomerUpdate = Partial<CustomerCreate>;

export function createCustomer(input: CustomerCreate): Promise<Customer> {
  return fetchJson("/api/v1/catalog/customers", Customer, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCustomer(
  id: string,
  patch: CustomerUpdate,
): Promise<Customer> {
  return fetchJson(`/api/v1/db/customers/${id}`, Customer, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await fetchJson(
    `/api/v1/db/customers/${id}`,
    z.object({}).passthrough(),
    { method: "DELETE" },
  );
}

export type TruckCreate = {
  plate: string;
  capacity_pallets: number;
  warehouse_id?: string | null;
};
export type TruckUpdate = Partial<TruckCreate>;

export function createTruck(input: TruckCreate): Promise<Truck> {
  return fetchJson("/api/v1/catalog/trucks", Truck, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateTruck(id: string, patch: TruckUpdate): Promise<Truck> {
  return fetchJson(`/api/v1/db/trucks/${id}`, Truck, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteTruck(id: string): Promise<void> {
  await fetchJson(`/api/v1/db/trucks/${id}`, z.object({}).passthrough(), {
    method: "DELETE",
  });
}

export type DriverCreate = { name: string };
export type DriverUpdate = Partial<DriverCreate>;

export function createDriver(input: DriverCreate): Promise<Driver> {
  // No /catalog/drivers endpoint — drivers have no auto-geocode/etc to do,
  // generic /db insert is sufficient.
  return fetchJson("/api/v1/db/drivers", Driver, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateDriver(id: string, patch: DriverUpdate): Promise<Driver> {
  return fetchJson(`/api/v1/db/drivers/${id}`, Driver, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteDriver(id: string): Promise<void> {
  await fetchJson(`/api/v1/db/drivers/${id}`, z.object({}).passthrough(), {
    method: "DELETE",
  });
}
