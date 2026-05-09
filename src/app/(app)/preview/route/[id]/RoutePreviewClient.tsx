"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { RouteHero } from "@/components/routes/RouteHero";
import type { Route } from "@/components/routes/columns";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import type { PlannerChatContext } from "@/lib/chat/types";

type Props = {
  route: Route;
};

export function RoutePreviewClient({ route }: Props) {
  const router = useRouter();
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Preview", onClick: () => router.push("/") },
      { label: route.code },
    ]);
    return () => setCrumbs([]);
  }, [route.code, router, setCrumbs]);

  useChatSurface(
    useMemo<PlannerChatContext>(
      () => ({
        surface: "route_overview",
        centerId: route.centerId,
        selected: { kind: "route", routeId: route.id },
      }),
      [route.centerId, route.id],
    ),
  );

  return (
    <PageLayout>
      <div className="flex h-full min-h-0 flex-col px-6 md:px-10 pt-5 pb-5">
        <RouteHero route={route} />
      </div>
    </PageLayout>
  );
}
