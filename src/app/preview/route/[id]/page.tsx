import { notFound } from "next/navigation";

import { sampleRoutes } from "@/components/routes/sample-data";

import { RoutePreviewClient } from "./RoutePreviewClient";

// Dev-only direct entry to RouteHero for a given sample route id (1..5).
// Bypasses the Centers → CenterRoutesView click chain so the hero can be
// inspected in isolation. Remove once routes have real URLs in the app.
export default async function RoutePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const route = sampleRoutes.find((r) => r.id === Number(id));
  if (!route) notFound();
  return <RoutePreviewClient route={route} />;
}
