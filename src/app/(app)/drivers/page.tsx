import { DriversListPage } from "@/components/drivers/DriversListPage";
import { listDriversWithZones } from "@/lib/api/catalog";
import { getErrorMessage } from "@/lib/api/errors";

export default async function DriversPage() {
  try {
    // /api/v1/data/drivers — drivers + their top historical zones derived
    // from past transports. Lets the UI show coverage at a glance.
    const drivers = await listDriversWithZones();

    return <DriversListPage initialDrivers={drivers} />;
  } catch (error) {
    return (
      <DriversListPage
        initialDrivers={[]}
        initialError={getErrorMessage(error)}
      />
    );
  }
}
