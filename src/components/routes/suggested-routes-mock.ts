// Mock optimizer output used by the AddRoute review surface. The real
// backend optimizer (`/api/v1/optimize/full/preview`) is the source of truth
// once wired; until then this returns deterministic suggestions so the UI can
// be driven end-to-end.
//
// Self-contained: does NOT import any sample-data file. Embeds a small fixed
// set of clients/drivers/trucks just for design.

export type SuggestedStopProduct = {
  material_code: string;
  description?: string | null;
  quantity: number;
  unit: string;
  category?: string | null;
};

export type SuggestedStop = {
  stop_id: string;
  sequence: number;
  customer_id: string;
  customer_name: string;
  city: string;
  lat: number | null;
  lng: number | null;
  zone: string;
  // Optional — populated by routeResultToSuggested when the suggestion came
  // from the backend optimizer. Persist forwards it so the saved transport's
  // delivery_stops carry the per-stop product breakdown.
  products?: SuggestedStopProduct[];
};

// Inline shape for the backend LoadPlan we stash on a suggestion so the
// downstream review/save flow can ship it to /optimize/persist intact.
// Kept structural (not imported from optimize.ts) to avoid an import cycle.
export type SuggestedRouteLoad = {
  transport_id: string;
  truck_type: string;
  pallets: Array<{
    pallet_index: number;
    pallet_id: string;
    stop_ids: string[];
    is_returnables: boolean;
    products_summary: string[];
    products: Array<{
      material_code: string;
      description?: string | null;
      quantity: number;
      unit: string;
      category?: string | null;
    }>;
  }>;
};

export type SuggestedRoute = {
  transport_id: string;
  route_code: string;
  driver_id: string;
  driver_name: string;
  truck_id: string;
  truck_code: string;
  truck_type: string;
  date: string;
  total_stops: number;
  ordered_stops: SuggestedStop[];
  // Present when the suggestion came from the backend optimizer (not the
  // in-memory mock). The persist flow forwards this so the load survives
  // alongside the saved transport.
  load?: SuggestedRouteLoad;
};

type FixtureClient = {
  id: string;
  name: string;
  city: string;
  zone: string;
  lat: number;
  lng: number;
};

const FIXTURE_CLIENTS: FixtureClient[] = [
  { id: "c-eix-01", name: "Bar La Plaça", city: "Barcelona", zone: "Eixample", lat: 41.3870, lng: 2.1700 },
  { id: "c-eix-02", name: "Cerveseria Universitat", city: "Barcelona", zone: "Eixample", lat: 41.3860, lng: 2.1620 },
  { id: "c-eix-03", name: "Restaurant Diagonal", city: "Barcelona", zone: "Eixample", lat: 41.3940, lng: 2.1580 },
  { id: "c-gra-01", name: "Bodega Verdi", city: "Barcelona", zone: "Gràcia", lat: 41.4030, lng: 2.1570 },
  { id: "c-gra-02", name: "Bar Vila de Gràcia", city: "Barcelona", zone: "Gràcia", lat: 41.4010, lng: 2.1530 },
  { id: "c-san-01", name: "Bar Sants Estació", city: "Barcelona", zone: "Sants-Montjuïc", lat: 41.3790, lng: 2.1410 },
  { id: "c-san-02", name: "Restaurant Hostafrancs", city: "Barcelona", zone: "Sants-Montjuïc", lat: 41.3760, lng: 2.1450 },
  { id: "c-mar-01", name: "Bar Poblenou", city: "Barcelona", zone: "Sant Martí", lat: 41.4040, lng: 2.2010 },
  { id: "c-mar-02", name: "Cafè Diagonal Mar", city: "Barcelona", zone: "Sant Martí", lat: 41.4090, lng: 2.2160 },
  { id: "c-cv-01", name: "Taberna Born", city: "Barcelona", zone: "Ciutat Vella", lat: 41.3850, lng: 2.1820 },
];

const FIXTURE_DRIVERS = [
  { id: "drv-01", name: "Marc Vidal" },
  { id: "drv-02", name: "Sara López" },
  { id: "drv-03", name: "David Martí" },
];

const FIXTURE_TRUCKS = [
  { id: "trk-01", code: "TRK-01", truck_type: "6pal" },
  { id: "trk-02", code: "TRK-02", truck_type: "8pal" },
  { id: "trk-03", code: "TRK-03", truck_type: "van" },
];

const toStop = (client: FixtureClient, sequence: number): SuggestedStop => ({
  stop_id: `S-${client.id}`,
  sequence,
  customer_id: client.id,
  customer_name: client.name,
  city: client.city,
  lat: client.lat,
  lng: client.lng,
  zone: client.zone,
});

const groupByZone = (clients: FixtureClient[]): Map<string, FixtureClient[]> => {
  const map = new Map<string, FixtureClient[]>();
  clients.forEach((c) => {
    const list = map.get(c.zone) ?? [];
    list.push(c);
    map.set(c.zone, list);
  });
  return map;
};

export function generateSuggestedRoutes(date: string): SuggestedRoute[] {
  const byZone = groupByZone(FIXTURE_CLIENTS);
  const groupings: { label: string; zones: string[] }[] = [
    { label: "A", zones: ["Eixample", "Ciutat Vella"] },
    { label: "B", zones: ["Gràcia", "Sant Martí"] },
    { label: "C", zones: ["Sants-Montjuïc"] },
  ];

  return groupings.map((g, i) => {
    const clients = g.zones.flatMap((z) => byZone.get(z) ?? []);
    const stops = clients.map((c, idx) => toStop(c, idx + 1));
    const driver = FIXTURE_DRIVERS[i % FIXTURE_DRIVERS.length]!;
    const truck = FIXTURE_TRUCKS[i % FIXTURE_TRUCKS.length]!;

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
