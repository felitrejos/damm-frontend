import { DriversListPage } from "@/components/drivers/DriversListPage";
import { listDrivers } from "@/lib/api/catalog";
import { getErrorMessage } from "@/lib/api/errors";

export default async function DriversPage() {
  try {
    const drivers = await listDrivers();

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
