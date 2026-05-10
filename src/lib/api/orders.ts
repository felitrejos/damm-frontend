import { z } from "zod";
import { fetchJson } from "./client";

const RawOrder = z.object({
  due_date: z.string().nullable().optional(),
  delivered_flag: z.boolean().optional(),
});

// Distinct due_dates across undelivered orders. The optimizer needs orders to
// have something to plan; days with zero pending orders return empty routes.
// Used to gate the date picker in AddRouteModal.
export async function listAvailableDates(): Promise<string[]> {
  const orders = await fetchJson(
    "/api/v1/db/orders?limit=20000",
    z.array(RawOrder),
  );
  const set = new Set<string>();
  for (const o of orders) {
    if (o.delivered_flag) continue;
    if (o.due_date) set.add(o.due_date);
  }
  return Array.from(set).sort();
}
