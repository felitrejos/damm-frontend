import { TrucksListPage } from "@/components/trucks/TrucksListPage";
import { listTrucks } from "@/lib/api/catalog";
import { getErrorMessage } from "@/lib/api/errors";

export default async function TrucksPage() {
  try {
    const trucks = await listTrucks();

    return <TrucksListPage initialTrucks={trucks} />;
  } catch (error) {
    return (
      <TrucksListPage
        initialTrucks={[]}
        initialError={getErrorMessage(error)}
      />
    );
  }
}
