import { sampleCenters } from "@/components/centers/sample-data";
import { sampleClients } from "@/components/clients/sample-data";

import type { Route } from "./columns";
import type { RouteStop, TimeWindow } from "./types";

// Builds a deterministic mock stop list per route. Backend
// `RouteResult.ordered_stops` (damm-backend/models/domain.py:165) is the real
// source — this stub keeps the shape so the wire-up later is a swap, not a
// rewrite.

const DEFAULT_DEPOT: { lat: number; lng: number } = { lat: 41.4350, lng: 2.1820 };

const ROUTE_START = "09:00";
const SERVICE_TIME_MIN = 12;
// Average urban delivery speed (km/h). Used to fake leg duration before the
// OSRM round-trip resolves.
const AVG_SPEED_KMH = 22;

export function getCenterDepot(centerId: number): { lat: number; lng: number } {
  const c = sampleCenters.find((x) => x.id === centerId);
  if (c?.lat != null && c?.lng != null) return { lat: c.lat, lng: c.lng };
  return DEFAULT_DEPOT;
}

export function buildStopsForRoute(route: Route): RouteStop[] {
  // Only clients with usable coords + identity fields can be plotted; the
  // rest (which the backend may return partially populated) are skipped.
  const geocoded = sampleClients.filter(
    (c): c is GeocodedClient =>
      typeof c.lat === "number" &&
      typeof c.lng === "number" &&
      typeof c.code === "string" &&
      typeof c.name === "string" &&
      typeof c.city === "string",
  );
  const count = Math.min(route.stops, geocoded.length);
  const order = seededOrder(route.id, geocoded.length).slice(0, count);
  const picks = order
    .map((i) => geocoded[i])
    .filter((c): c is GeocodedClient => c !== undefined);

  const depot = getCenterDepot(route.centerId);
  const stops: RouteStop[] = [];

  let cursorMin = toMinutes(ROUTE_START);
  let prevLat = depot.lat;
  let prevLng = depot.lng;

  picks.forEach((client, idx) => {
    const distKm = haversineKm(prevLat, prevLng, client.lat, client.lng);
    const travelMin = (distKm / AVG_SPEED_KMH) * 60;
    cursorMin += travelMin;

    const eta = fromMinutes(cursorMin);
    const window = makeWindow(cursorMin, idx);

    stops.push({
      stop_id: `S-${route.code}-${String(idx + 1).padStart(2, "0")}`,
      sequence: idx + 1,
      customer_id: client.code,
      customer_name: client.name,
      address: `${client.zone}, ${client.city}`,
      city: client.city,
      lat: client.lat,
      lng: client.lng,
      time_window: window,
      estimated_arrival: eta,
      service_time_min: SERVICE_TIME_MIN,
    });

    cursorMin += SERVICE_TIME_MIN;
    prevLat = client.lat;
    prevLng = client.lng;
  });

  return stops;
}

type GeocodedClient = (typeof sampleClients)[number] & {
  lat: number;
  lng: number;
  code: string;
  name: string;
  city: string;
};

// Deterministic shuffle keyed by route id. Fisher-Yates with a small LCG so
// the same route always picks the same clients in the same order.
function seededOrder(seed: number, n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = (seed * 9301 + 49297) % 233280;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function haversineKm(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371;
  const dLa = ((la2 - la1) * Math.PI) / 180;
  const dLo = ((lo2 - lo1) * Math.PI) / 180;
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) *
      Math.cos((la2 * Math.PI) / 180) *
      Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fromMinutes(min: number): string {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function makeWindow(centerMin: number, idx: number): TimeWindow {
  // Window of ±20 min around ETA, with the third stop intentionally tighter
  // to demo the "tight window" / late-flag UX.
  const slack = idx === 2 ? 8 : 20;
  return {
    open: fromMinutes(centerMin - slack),
    close: fromMinutes(centerMin + slack),
  };
}
