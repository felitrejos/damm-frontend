"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";

import { type Route, routeColumns } from "./columns";
import { RouteHero } from "./RouteHero";
import { sampleRoutes } from "./sample-data";

export function RoutesListPage() {
  const [selected, setSelected] = useState<Route | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Routes", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.route_code }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        {selected ? (
          <RouteHero route={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            <div>
              <h2 className="headline text-ink">Routes</h2>
              <p className="body-lg text-ink-muted mt-2">
                Pick a route to inspect its truck load and map.
              </p>
            </div>
            <DataTable
              data={sampleRoutes}
              columns={routeColumns}
              getRowId={(row) => row.id.toString()}
              searchColumnId="route_code"
              searchPlaceholder="Search routes..."
              searchAriaLabel="Search routes"
              filterColumnId="truck_type"
              filterLabel="Filter by truck"
              filterMobileLabel="Truck"
              selectedRowId={null}
              onRowClick={(route) => setSelected(route)}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}
