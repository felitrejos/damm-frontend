import { z } from "zod";
import { fetchJson } from "./client";
import { listCustomers, type Customer } from "./catalog";
import type {
  SuggestedRoute,
  SuggestedStop,
} from "@/components/routes/suggested-routes-mock";

// Schemas mirror /api/v1/optimize/full/preview response. Only the fields the
// modal review surface renders are typed strictly — the rest are kept loose
// (passthrough) so backend additions don't break the parse.

const OrderedStopSchema = z
  .object({
    stop_id: z.string(),
    sequence: z.number(),
    customer_id: z.string(),
    customer_name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  })
  .passthrough();

const RouteResultSchema = z
  .object({
    transport_id: z.string(),
    route_code: z.string(),
    driver_id: z.string().nullable().optional(),
    driver_name: z.string().nullable().optional(),
    truck_type: z.string().nullable().optional(),
    vehicle_id: z.string().nullable().optional(),
    date: z.string(),
    ordered_stops: z.array(OrderedStopSchema),
    total_stops: z.number().optional(),
    total_distance_km: z.number().optional(),
    total_time_min: z.number().optional(),
  })
  .passthrough();

const OptimizationResultSchema = z
  .object({
    job_id: z.string(),
    status: z.string(),
    route: RouteResultSchema.nullable().optional(),
    routes: z.array(RouteResultSchema).optional(),
    error_message: z.string().nullable().optional(),
  })
  .passthrough();

const PreviewResponseSchema = z.object({
  result: OptimizationResultSchema,
});

export type OptimizeRequest = {
  date?: string;
  warehouse_id?: string;
  max_orders?: number;
  truck_type?: "van" | "6pal" | "8pal";
  respect_time_windows?: boolean;
  solver_time_limit_s?: number;
  use_real_roads?: boolean;
  include_returnables?: boolean;
};

export async function optimizePreview(req: OptimizeRequest) {
  const parsed = await fetchJson(
    "/api/v1/optimize/full/preview",
    PreviewResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    },
  );
  return parsed.result;
}

const PersistResponseSchema = z.object({
  status: z.string(),
  transport_id: z.string(),
  stops_inserted: z.number(),
  resolved_driver_id: z.string().nullable().optional(),
  resolved_truck_id: z.string().nullable().optional(),
  resolved_route_id: z.string().nullable().optional(),
});

export type PersistResponse = z.infer<typeof PersistResponseSchema>;

// Persist a SuggestedRoute (from generateSuggestedRoutesFromBackend) by
// constructing the minimal RouteResult shape the backend's /persist endpoint
// expects. Products/returnables aren't carried — the backend skips
// delivery_lines for preview-derived routes anyway.
export async function persistSuggestedRoute(
  suggestion: SuggestedRoute,
  warehouseId: string,
): Promise<PersistResponse> {
  const route = {
    transport_id: suggestion.transport_id,
    route_code: suggestion.route_code,
    driver_id: suggestion.driver_id || "",
    driver_name: suggestion.driver_name,
    truck_type: suggestion.truck_type,
    vehicle_id: suggestion.truck_id || null,
    date: suggestion.date,
    shift: 1 as const,
    ordered_stops: suggestion.ordered_stops.map((s) => ({
      stop_id: s.stop_id,
      sequence: s.sequence,
      customer_id: s.customer_id,
      customer_name: s.customer_name,
      address: "",
      postal_code: "",
      city: s.city,
      lat: s.lat,
      lng: s.lng,
    })),
    total_stops: suggestion.total_stops,
  };

  return fetchJson("/api/v1/optimize/persist", PersistResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, warehouse_id: warehouseId }),
  });
}

// Build a lookup table customer_id -> zone_code so we can enrich stops with
// the field RouteReviewPanel uses for clustering.
function buildZoneIndex(customers: Customer[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of customers) {
    if (c.zone_code) map.set(c.id, c.zone_code);
  }
  return map;
}

function routeResultToSuggested(
  route: z.infer<typeof RouteResultSchema>,
  zoneByCustomer: Map<string, string>,
  variantLabel: string,
): SuggestedRoute {
  const ordered_stops: SuggestedStop[] = route.ordered_stops.map((s) => ({
    stop_id: s.stop_id,
    sequence: s.sequence,
    customer_id: s.customer_id,
    customer_name: s.customer_name ?? "—",
    city: s.city ?? "",
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    zone: zoneByCustomer.get(s.customer_id) ?? "—",
  }));

  return {
    transport_id: `${route.transport_id}-${variantLabel}`,
    route_code: `${route.route_code} (${variantLabel})`,
    driver_id: route.driver_id ?? "",
    driver_name: route.driver_name ?? "—",
    truck_id: route.vehicle_id ?? "",
    truck_code: route.vehicle_id ?? "—",
    truck_type: route.truck_type ?? "8pal",
    date: route.date,
    total_stops: route.ordered_stops.length,
    ordered_stops,
  };
}

// Three variations to give the user options. They differ on params guaranteed
// to push the solver toward different solutions:
//   A — strict time windows, smaller cap (compact)
//   B — relaxed time windows, larger cap (more stops)
//   C — force a smaller truck (different vehicle profile)
const VARIATIONS: Array<{
  label: string;
  params: Omit<OptimizeRequest, "date" | "warehouse_id">;
}> = [
  {
    label: "A",
    params: { max_orders: 15, respect_time_windows: true, solver_time_limit_s: 8 },
  },
  {
    label: "B",
    params: { max_orders: 30, respect_time_windows: false, solver_time_limit_s: 8 },
  },
  {
    label: "C",
    params: {
      max_orders: 20,
      truck_type: "6pal",
      respect_time_windows: true,
      solver_time_limit_s: 8,
    },
  },
];

export type GenerateOptions = {
  date: string;
  warehouseId: string;
};

// Calls the optimizer N times in parallel and maps each successful result to
// the SuggestedRoute shape the modal already renders. Failed variations are
// silently dropped (so a partial backend wobble still yields something).
export async function generateSuggestedRoutesFromBackend({
  date,
  warehouseId,
}: GenerateOptions): Promise<SuggestedRoute[]> {
  const customers = await listCustomers().catch(() => [] as Customer[]);
  const zoneIndex = buildZoneIndex(customers);

  const settled = await Promise.allSettled(
    VARIATIONS.map((v) =>
      optimizePreview({
        date,
        warehouse_id: warehouseId,
        ...v.params,
      }).then((res) => ({ variant: v.label, res })),
    ),
  );

  const out: SuggestedRoute[] = [];
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    const route = r.value.res.route;
    if (!route) continue;
    out.push(routeResultToSuggested(route, zoneIndex, r.value.variant));
  }
  return out;
}
