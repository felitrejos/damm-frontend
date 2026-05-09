import { DriversListPage } from "@/components/drivers/DriversListPage";
import { listDrivers } from "@/lib/api/catalog";

export default async function DriversPage() {
  const drivers = await listDrivers();

  return <DriversListPage initialDrivers={drivers} />;
}
