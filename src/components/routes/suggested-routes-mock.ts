import { sampleClients } from "@/components/clients/sample-data";
import { sampleDrivers } from "@/components/drivers/sample-data";
import { sampleTrucks } from "@/components/trucks/sample-data";
import type { Client } from "@/components/clients/columns";

// Subset of `RouteResult` from wiki/contracts/data-models.md § Route And
// Optimization Models — only the fields the AddRoute review surface renders.
// When the backend endpoint lands, swap this for the generated type.
export type SuggestedStop = {
  stop_id: string;
  sequence: number;
  customer_id: number;
  customer_name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  zone: string;
};

export type SuggestedRoute = {
  transport_id: string;
  route_code: string;
  driver_id: number;
  driver_name: string;
  truck_id: number;
  truck_code: string;
  truck_type: string;
  date: string;
  total_stops: number;
  ordered_stops: SuggestedStop[];
};

const toStop = (client: Client, sequence: number): SuggestedStop => ({
  stop_id: `S-${client.id.toString().padStart(3, "0")}`,
  sequence,
  customer_id: client.id,
  customer_name: client.name,
  city: client.city ?? "",
  lat: client.lat ?? null,
  lng: client.lng ?? null,
  zone: client.zone,
});

const groupByZone = (clients: Client[]): Map<string, Client[]> => {
  const map = new Map<string, Client[]>();
  clients.forEach((c) => {
    const list = map.get(c.zone) ?? [];
    list.push(c);
    map.set(c.zone, list);
  });
  return map;
};

// Generate three plausible suggestions for a given date. Each suggestion
// pulls a subset of clients (grouped to keep zones coherent), and picks a
// driver and truck round-robin.
export function generateSuggestedRoutes(date: string): SuggestedRoute[] {
  const byZone = groupByZone(sampleClients);
  const zoneEntries = Array.from(byZone.entries());

  // Three deterministic groupings so re-runs are stable per session.
  const groupings: { label: string; zones: string[] }[] = [
    { label: "A", zones: ["Eixample", "Ciutat Vella"] },
    { label: "B", zones: ["Gràcia", "Sant Martí"] },
    { label: "C", zones: ["Sants-Montjuïc"] },
  ];

  return groupings.map((g, i) => {
    const clients = g.zones.flatMap((z) => byZone.get(z) ?? []);
    // Fallback: if the curated zones produced nothing (data shifted), take
    // the i-th zone as a safety net so the UI never renders an empty route.
    const safe = clients.length > 0
      ? clients
      : zoneEntries[i % zoneEntries.length]?.[1] ?? [];
    const stops = safe.map((c, idx) => toStop(c, idx + 1));

    const driver = sampleDrivers[i % sampleDrivers.length];
    const truck = sampleTrucks[i % sampleTrucks.length];

    return {
      transport_id: `T-${date}-${g.label}`,
      route_code: `R-${g.label}`,
      driver_id: driver.id,
      driver_name: driver.name,
      truck_id: truck.id,
      truck_code: truck.code,
      truck_type: truck.truck_type,
      date,
      total_stops: stops.length,
      ordered_stops: stops,
    };
  });
}
