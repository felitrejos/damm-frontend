import { notFound } from "next/navigation";

import { sampleRoutes } from "@/components/routes/sample-data";

import { RoutePreviewClient } from "./RoutePreviewClient";

// Dev-only direct entry to RouteHero for a given sampleRoutes id
// (101, 102, 103, 201, 202, 301, 401, 501, 502, 801, 802, 803, 901).
// Bypasses the Centers → CenterDetailPage click chain so the hero can be
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
