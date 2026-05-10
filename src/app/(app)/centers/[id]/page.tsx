import { notFound } from "next/navigation";
import { z } from "zod";

import { CenterDetailPage } from "@/components/centers/CenterDetailPage";
import { fetchJson } from "@/lib/api/client";
import { listTrucks, type Truck } from "@/lib/api/catalog";
import { listTransports, type TransportSummary } from "@/lib/api/transports";
import { getWarehouse } from "@/lib/api/warehouses";

// Raw rows from /db/transports — used only here to recover `truck_id`, which
// the higher-level /data/transports summary doesn't include.
const RawTransport = z.object({
  id: z.string(),
  truck_id: z.string().nullable().optional(),
});

async function listRawTransports() {
  return fetchJson("/api/v1/db/transports?limit=10000", z.array(RawTransport));
}

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;

  const center = await getWarehouse(id);
  if (!center) notFound();

  // Filter transports by joining transport.truck_id -> truck.warehouse_id.
  // Today most transports have a null truck_id and don't appear under any
  // center; that fills in as the optimizer assigns trucks to runs.
  let routes: TransportSummary[] = [];
  try {
    const [summaries, trucks, raw] = await Promise.all([
      listTransports(),
      listTrucks(),
      listRawTransports(),
    ]);

    const truckIdsInCenter = new Set(
      trucks
        .filter((t: Truck) => t.warehouse_id === center.id)
        .map((t: Truck) => t.id),
    );

    const transportIdsInCenter = new Set(
      raw
        .filter((t) => t.truck_id != null && truckIdsInCenter.has(t.truck_id))
        .map((t) => t.id),
    );

    routes = summaries.filter((s) => transportIdsInCenter.has(s.transport_id));
  } catch {
    routes = [];
  }

  return <CenterDetailPage center={center} routes={routes} />;
}
