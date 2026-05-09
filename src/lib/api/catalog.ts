import { z } from "zod";
import { fetchJson } from "./client";

export const Truck = z.object({
  id: z.number(),
  code: z.string(),
  plate: z.string().nullable().optional(),
  truck_type: z.string(),
  capacity_pallets: z.number(),
  warehouse_id: z.number().nullable().optional(),
  active: z.coerce.boolean(),
});
export type Truck = z.infer<typeof Truck>;

export const Customer = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  name_2: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  payment_condition: z.string().nullable().optional(),
  service_notes: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});
export type Customer = z.infer<typeof Customer>;

export const Driver = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
});
export type Driver = z.infer<typeof Driver>;

export function listTrucks(): Promise<Truck[]> {
  return fetchJson("/api/v1/db/trucks?limit=10000", z.array(Truck));
}

export function listCustomers(): Promise<Customer[]> {
  return fetchJson("/api/v1/db/customers?limit=10000", z.array(Customer));
}

export function listDrivers(): Promise<Driver[]> {
  return fetchJson("/api/v1/db/drivers?limit=10000", z.array(Driver));
}
