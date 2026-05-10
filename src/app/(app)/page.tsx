import { CentersListPage } from "@/components/centers/CentersListPage";
import { listWarehouses } from "@/lib/api/warehouses";
import { getErrorMessage } from "@/lib/api/errors";

export default async function Home() {
  try {
    const centers = await listWarehouses();
    return <CentersListPage initialCenters={centers} />;
  } catch (error) {
    return (
      <CentersListPage
        initialCenters={[]}
        initialError={getErrorMessage(error)}
      />
    );
  }
}
