import { notFound } from "next/navigation";

import { fetchJson } from "@/lib/api/client";
import { listTrucks, type Truck } from "@/lib/api/catalog";
import { getTransport } from "@/lib/api/transports";
import { getWarehouse, type Warehouse } from "@/lib/api/warehouses";
import { z } from "zod";

import { RoutePreviewClient } from "./RoutePreviewClient";

const RawTransport = z.object({
  id: z.string(),
  truck_id: z.string().nullable().optional(),
});

// Direct entry to RouteHero for a given backend transport_id. Resolves the
// home warehouse via transport.truck_id -> trucks.warehouse_id when possible
// (often null) so the map view has a depot.
export default async function RoutePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getTransport(id);
  if (!detail) notFound();

  let center: Warehouse | null = null;
  try {
    const raw = await fetchJson(`/api/v1/db/transports/${id}`, RawTransport);
    if (raw.truck_id) {
      const trucks = await listTrucks();
      const truck = trucks.find((t: Truck) => t.id === raw.truck_id);
      if (truck?.warehouse_id) {
        center = await getWarehouse(truck.warehouse_id);
      }
    }
  } catch {
    center = null;
  }

  // Build a TransportSummary-shaped Route for RouteHero KPIs.
  const route = {
    transport_id: detail.transport_id,
    route_code: detail.route_code,
    driver_name: detail.driver_name ?? null,
    date: detail.date,
    stop_count: detail.stops.length,
    truck_type: detail.truck_type ?? null,
  };

  return <RoutePreviewClient route={route} center={center} />;
}
