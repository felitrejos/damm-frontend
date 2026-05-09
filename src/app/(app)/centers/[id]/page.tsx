import { notFound } from "next/navigation";

import { CenterDetailPage } from "@/components/centers/CenterDetailPage";
import { sampleCenters } from "@/components/centers/sample-data";

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const center = sampleCenters.find((c) => c.id.toString() === id);
  if (!center) notFound();

  return <CenterDetailPage center={center} />;
}
