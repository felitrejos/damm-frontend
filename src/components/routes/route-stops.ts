import type { TransportStop } from "@/lib/api/transports";
import type { Warehouse } from "@/lib/api/warehouses";

import type { RouteStop } from "./types";

// Default depot used when a Warehouse has no coords (Barcelona Eixample).
const DEFAULT_DEPOT: { lat: number; lng: number } = { lat: 41.4350, lng: 2.1820 };

const SERVICE_TIME_MIN = 12;

export function depotForCenter(
  center: Pick<Warehouse, "lat" | "lng"> | null | undefined,
): { lat: number; lng: number } {
  if (center?.lat != null && center?.lng != null) {
    return { lat: center.lat, lng: center.lng };
  }
  return DEFAULT_DEPOT;
}

// Convert a backend TransportStop into the richer RouteStop shape that the map
// view expects. Stops missing coords are dropped (the map can't plot them).
export function transportStopsToRouteStops(
  stops: TransportStop[],
): RouteStop[] {
  return stops
    .filter((s): s is TransportStop & { lat: number; lng: number } =>
      typeof s.lat === "number" && typeof s.lng === "number",
    )
    .map((s) => ({
      stop_id: s.stop_id ?? `${s.customer_id}-${s.sequence}`,
      sequence: s.sequence,
      customer_id: s.customer_id,
      customer_name: s.customer_name ?? "—",
      address: s.address ?? "",
      city: s.city ?? "",
      lat: s.lat,
      lng: s.lng,
      time_window: s.time_window ?? null,
      estimated_arrival: s.estimated_arrival ?? null,
      service_time_min: SERVICE_TIME_MIN,
    }));
}
