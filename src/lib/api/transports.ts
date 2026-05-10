import { z } from "zod";
import { fetchJson } from "./client";

// /api/v1/data/transports — TransportSummary list (one per scheduled
// dispatch, joined with route + driver name + truck type when available).
export const TransportSummary = z.object({
  transport_id: z.string(),
  route_code: z.string(),
  driver_name: z.string().nullable().optional(),
  date: z.string(),
  stop_count: z.number(),
  truck_type: z.string().nullable().optional(),
});
export type TransportSummary = z.infer<typeof TransportSummary>;

const TimeWindow = z.object({
  open: z.string(),
  close: z.string(),
});

// Backend includes a richer payload (products, returnables, payment_condition,
// etc.). Schema captures the fields the UI currently renders; unknown ones are
// dropped by Zod.parse since strict() isn't set on z.object by default but we
// keep it permissive via .passthrough where useful — here we explicitly list.
export const TransportStop = z.object({
  stop_id: z.string().optional(),
  sequence: z.number(),
  customer_id: z.string(),
  customer_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  time_window: TimeWindow.nullable().optional(),
  estimated_arrival: z.string().nullable().optional(),
});
export type TransportStop = z.infer<typeof TransportStop>;

export const TransportDetail = z.object({
  transport_id: z.string(),
  route_code: z.string(),
  driver_id: z.string().nullable().optional(),
  driver_name: z.string().nullable().optional(),
  date: z.string(),
  truck_type: z.string().nullable().optional(),
  stops: z.array(TransportStop),
});
export type TransportDetail = z.infer<typeof TransportDetail>;

export function listTransports(): Promise<TransportSummary[]> {
  return fetchJson("/api/v1/data/transports", z.array(TransportSummary));
}

export async function getTransport(id: string): Promise<TransportDetail | null> {
  try {
    return await fetchJson(`/api/v1/data/transport/${id}`, TransportDetail);
  } catch {
    return null;
  }
}

export async function deleteTransport(id: string): Promise<void> {
  await fetchJson(
    `/api/v1/db/transports/${id}`,
    z.object({}).passthrough(),
    { method: "DELETE" },
  );
}
