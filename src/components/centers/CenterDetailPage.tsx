"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/shared/DataTable";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { AddRouteModal } from "@/components/routes/AddRouteModal";
import { routeColumns, type Route } from "@/components/routes/columns";
import { RouteHero } from "@/components/routes/RouteHero";
import { sampleRoutes } from "@/components/routes/sample-data";

import type { Center } from "./columns";

type Props = {
  center: Center;
};

export function CenterDetailPage({ center }: Props) {
  const router = useRouter();
  const { setCrumbs } = useBreadcrumb();

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [addRouteOpen, setAddRouteOpen] = useState(false);

  const routes = useMemo(
    () => sampleRoutes.filter((r) => r.centerId === center.id),
    [center.id],
  );

  useEffect(() => {
    setCrumbs([
      { label: "Centers", onClick: () => router.push("/") },
      { label: center.center, onClick: () => setSelectedRoute(null) },
      ...(selectedRoute ? [{ label: selectedRoute.code }] : []),
    ]);
    return () => setCrumbs([]);
  }, [center, selectedRoute, setCrumbs, router]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        {selectedRoute ? (
          <RouteHero
            route={selectedRoute}
            onBack={() => setSelectedRoute(null)}
          />
        ) : (
          <>
            <div>
              <h2 className="headline text-ink">{center.center}</h2>
              <p className="body-lg text-ink-muted mt-2">
                Routes dispatched from this center. Add a new one or open an
                existing route to inspect its plan.
              </p>
            </div>

            <DataTable
              data={routes}
              columns={routeColumns}
              getRowId={(row) => row.id.toString()}
              searchColumnId="code"
              searchPlaceholder="Search routes..."
              searchAriaLabel="Search routes"
              addButtonLabel="Add Route"
              onAdd={() => setAddRouteOpen(true)}
              selectedRowId={null}
              onRowClick={(r) => setSelectedRoute(r)}
            />
          </>
        )}
      </div>

      <AddRouteModal
        open={addRouteOpen}
        onOpenChange={setAddRouteOpen}
        centerId={center.id}
      />
    </PageLayout>
  );
}
