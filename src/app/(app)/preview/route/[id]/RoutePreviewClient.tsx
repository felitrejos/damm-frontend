"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { RouteHero } from "@/components/routes/RouteHero";
import type { Route } from "@/components/routes/columns";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import type { Warehouse } from "@/lib/api/warehouses";
import type { PlannerChatContext } from "@/lib/chat/types";

type Props = {
  route: Route;
  center: Warehouse | null;
};

export function RoutePreviewClient({ route, center }: Props) {
  const router = useRouter();
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Preview", onClick: () => router.push("/") },
      { label: route.route_code },
    ]);
    return () => setCrumbs([]);
  }, [route.route_code, router, setCrumbs]);

  useChatSurface(
    useMemo<PlannerChatContext>(
      () => ({
        surface: "route_overview",
        centerId: center?.id ?? null,
        selected: { kind: "route", routeId: route.transport_id },
      }),
      [center?.id, route.transport_id],
    ),
  );

  return (
    <PageLayout>
      <div className="flex h-full min-h-0 flex-col px-6 md:px-10 pt-5 pb-5">
        <RouteHero route={route} center={center} />
      </div>
    </PageLayout>
  );
}
