import { TrucksListPage } from "@/components/trucks/TrucksListPage";
import { listTrucks } from "@/lib/api/catalog";

export default async function TrucksPage() {
  const trucks = await listTrucks();

  return <TrucksListPage initialTrucks={trucks} />;
}
