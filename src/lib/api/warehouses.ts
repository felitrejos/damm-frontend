import { z } from "zod";
import { fetchJson } from "./client";

// Backend `/api/v1/db/warehouses` returns lat/lng as strings; coerce.
export const Warehouse = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lat: z.coerce.number().nullable().optional(),
  lng: z.coerce.number().nullable().optional(),
});
export type Warehouse = z.infer<typeof Warehouse>;

export function listWarehouses(): Promise<Warehouse[]> {
  return fetchJson("/api/v1/db/warehouses?limit=10000", z.array(Warehouse));
}

export async function getWarehouse(id: string): Promise<Warehouse | null> {
  try {
    return await fetchJson(`/api/v1/db/warehouses/${id}`, Warehouse);
  } catch {
    return null;
  }
}

export type WarehouseCreate = {
  name: string;
  city?: string;
  postal_code?: string;
  address?: string;
};

export function createWarehouse(input: WarehouseCreate): Promise<Warehouse> {
  return fetchJson("/api/v1/catalog/warehouses", Warehouse, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export type WarehouseUpdate = Partial<WarehouseCreate>;

export function updateWarehouse(
  id: string,
  patch: WarehouseUpdate,
): Promise<Warehouse> {
  return fetchJson(`/api/v1/db/warehouses/${id}`, Warehouse, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteWarehouse(id: string): Promise<void> {
  await fetchJson(
    `/api/v1/db/warehouses/${id}`,
    z.object({}).passthrough(),
    { method: "DELETE" },
  );
}
