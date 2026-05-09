"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import type { Center } from "@/components/centers/columns";

import { type Route, routeColumns } from "./columns";
import { sampleRoutes } from "./sample-data";

type CenterRoutesViewProps = {
  center: Center;
  onRouteSelect: (route: Route) => void;
};

export function CenterRoutesView({
  center,
  onRouteSelect,
}: CenterRoutesViewProps) {
  const routes = useMemo(
    () => sampleRoutes.filter((r) => r.center_id === center.id),
    [center.id],
  );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="headline text-ink">Routes</h2>
        <p className="body-lg text-ink-muted mt-2">
          Plans dispatched from{" "}
          <span className="text-ink">{center.center}</span>. Pick one to inspect
          its truck load and map.
        </p>
      </div>

      {routes.length === 0 ? (
        <RemoteDataState
          title="No routes for this center"
          description="There are no planned routes here yet. New routes will appear once a plan is created."
        />
      ) : (
        <DataTable
          data={routes}
          columns={routeColumns}
          getRowId={(row) => row.id.toString()}
          searchColumnId="route_code"
          searchPlaceholder="Search routes..."
          searchAriaLabel="Search routes"
          filterColumnId="truck_type"
          filterLabel="Filter by truck"
          filterMobileLabel="Truck"
          selectedRowId={null}
          onRowClick={onRouteSelect}
        />
      )}
    </div>
  );
}
