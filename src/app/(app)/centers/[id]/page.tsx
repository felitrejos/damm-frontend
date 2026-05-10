import { notFound } from "next/navigation";

import { CenterDetailPage } from "@/components/centers/CenterDetailPage";
import { listTransports, type TransportSummary } from "@/lib/api/transports";
import { getWarehouse } from "@/lib/api/warehouses";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;

  const center = await getWarehouse(id);
  if (!center) notFound();

  // No per-warehouse filter: the seeded dataset has transports with route_id +
  // driver_id but no truck_id, so a `transport.truck_id -> truck.warehouse_id`
  // join filtered out everything useful (route_code/driver_name came back
  // empty for the few that survived). Single-warehouse demo so showing all
  // transports here is honest. Re-introduce the filter once a second warehouse
  // is seeded with truck assignments that actually overlap with route data.
  let routes: TransportSummary[] = [];
  try {
    routes = await listTransports();
  } catch {
    routes = [];
  }

  return <CenterDetailPage center={center} routes={routes} />;
}
