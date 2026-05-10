import { z } from "zod";
import { fetchJson } from "./client";

const RawOrder = z.object({
  due_date: z.string().nullable().optional(),
  delivered_flag: z.boolean().optional(),
});

// Distinct due_dates across undelivered orders. The optimizer needs orders to
// have something to plan; days with zero pending orders return empty routes.
// Used to gate the date picker in AddRouteModal.
//
// Note: backend caps `limit` at 10000. There are ~12k orders today, so a few
// dates at the very tail of the calendar may be missed — acceptable for the
// demo since orders are densely packed (35 distinct dates over ~2 months).
export async function listAvailableDates(): Promise<string[]> {
  const orders = await fetchJson(
    "/api/v1/db/orders?limit=10000",
    z.array(RawOrder),
  );
  const set = new Set<string>();
  for (const o of orders) {
    if (o.delivered_flag) continue;
    if (o.due_date) set.add(o.due_date);
  }
  return Array.from(set).sort();
}

const ImportResponseSchema = z.object({
  status: z.string(),
  received: z.number(),
  inserted: z.number(),
  skipped: z.number(),
  unknown_customers: z.array(z.string()).optional(),
  unknown_materials: z.array(z.string()).optional(),
});

export type ImportResponse = z.infer<typeof ImportResponseSchema>;

// One-click demo import. Backend re-imports its bundled sample CSV with the
// given due_date applied to every row. Returns the count summary.
export async function importSampleOrders(date: string): Promise<ImportResponse> {
  const url = `/api/v1/data/orders/import-sample?due_date=${encodeURIComponent(date)}`;
  return fetchJson(url, ImportResponseSchema, { method: "POST" });
}
