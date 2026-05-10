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

// Per-pallet payload from the backend LoadPlan. We only declare the fields
// the truck visualization adapter consumes; the rest comes through
// .passthrough so future backend additions don't break parsing.
const BackendProductSchema = z
  .object({
    material_code: z.string(),
    description: z.string().nullable().optional(),
    quantity: z.number(),
    unit: z.string(),
    category: z.string().nullable().optional(),
    is_returnable: z.boolean().optional(),
  })
  .passthrough();

const BackendPalletSchema = z
  .object({
    pallet_index: z.number(),
    pallet_id: z.string(),
    stop_ids: z.array(z.string()).default([]),
    is_returnables: z.boolean().default(false),
    products: z.array(BackendProductSchema).default([]),
    products_summary: z.array(z.string()).default([]),
    total_height_cm: z.number().nullable().optional(),
    total_weight_kg: z.number().nullable().optional(),
    total_volume_l: z.number().nullable().optional(),
  })
  .passthrough();

const BackendLoadPlanSchema = z
  .object({
    transport_id: z.string(),
    truck_type: z.string(),
    pallets: z.array(BackendPalletSchema).default([]),
  })
  .passthrough();

export type BackendLoadPlan = z.infer<typeof BackendLoadPlanSchema>;
export type BackendPallet = z.infer<typeof BackendPalletSchema>;
export type BackendProduct = z.infer<typeof BackendProductSchema>;

const OptimizationResultSchema = z
  .object({
    job_id: z.string(),
    status: z.string(),
    route: RouteResultSchema.nullable().optional(),
    routes: z.array(RouteResultSchema).optional(),
    load: BackendLoadPlanSchema.nullable().optional(),
    loads: z.array(BackendLoadPlanSchema).optional(),
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
    // Forwarding `load` lets the backend stash the LoadPlan on the transport
    // row so the truck visualization survives a refresh / future visit.
    body: JSON.stringify({
      route,
      warehouse_id: warehouseId,
      load: suggestion.load ?? null,
    }),
  });
}

// Persist every suggestion of a generated plan, sequentially. Each request
// hits a backend that does read-modify-write on the JSON DB without a lock,
// so parallel calls race and only the last save survives. One-at-a-time is
// slow-ish (~50ms × N) but correct; failures don't abort the rest.
export async function persistAllSuggestedRoutes(
  suggestions: SuggestedRoute[],
  warehouseId: string,
): Promise<{
  succeeded: PersistResponse[];
  failed: Array<{ suggestion: SuggestedRoute; error: unknown }>;
}> {
  const succeeded: PersistResponse[] = [];
  const failed: Array<{ suggestion: SuggestedRoute; error: unknown }> = [];
  for (const s of suggestions) {
    try {
      succeeded.push(await persistSuggestedRoute(s, warehouseId));
    } catch (error) {
      failed.push({ suggestion: s, error });
    }
  }
  return { succeeded, failed };
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
  load?: BackendLoadPlan,
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
    transport_id: route.transport_id,
    // Keep route_code exactly as the optimizer emitted it ("OPT-XX") so the
    // persisted transport carries a clean label and the table filter (which
    // matches /OPT-/) catches it.
    route_code: route.route_code,
    driver_id: route.driver_id ?? "",
    driver_name: route.driver_name ?? "—",
    truck_id: route.vehicle_id ?? "",
    truck_code: route.vehicle_id ?? "—",
    truck_type: route.truck_type ?? "8pal",
    date: route.date,
    total_stops: route.ordered_stops.length,
    ordered_stops,
    load,
  };
}

export type GenerateOptions = {
  date: string;
  warehouseId: string;
};

// Single solver run that plans the entire day. Returns one SuggestedRoute per
// truck the solver decided to use (so the modal can show the full plan and
// the user can save part or all of it). max_orders is set high so the solver
// has real material to cluster geographically and fill trucks meaningfully.
export async function generateSuggestedRoutesFromBackend({
  date,
  warehouseId,
}: GenerateOptions): Promise<SuggestedRoute[]> {
  const [customers, result] = await Promise.all([
    listCustomers().catch(() => [] as Customer[]),
    optimizePreview({
      date,
      warehouse_id: warehouseId,
      max_orders: 200,
      // Time windows are seeded for ~half of the customers and the
      // overlapping ones are infeasible together — or-tools always returns
      // None within the time limit and falls back to greedy. Soft-disabling
      // them lets or-tools converge (verified: same input solves to 4 trucks
      // in <60s vs greedy's 5 trucks). Re-enable once windows become soft
      // constraints in the backend solver.
      respect_time_windows: false,
      solver_time_limit_s: 25,
    }),
  ]);

  const zoneIndex = buildZoneIndex(customers);
  const routes = result.routes ?? (result.route ? [result.route] : []);
  // Backend returns loads aligned by index (and by transport_id) with routes.
  // Build a lookup so we can attach each route's matching load even if the
  // ordering ever drifts.
  const loadById = new Map<string, BackendLoadPlan>();
  for (const ld of result.loads ?? []) {
    loadById.set(ld.transport_id, ld);
  }
  return routes.map((r) =>
    routeResultToSuggested(r, zoneIndex, loadById.get(r.transport_id)),
  );
}
