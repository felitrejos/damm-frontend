"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TransportSummary } from "@/lib/api/transports";

// "Route" in the UI === backend `Transport` (the scheduled instance with a
// driver, date, and stop list). The `routes` table in backend is just the
// route-code template and isn't surfaced here.
export type Route = TransportSummary;

// Edit isn't exposed yet — there's no clear semantic for "editing a transport"
// (which fields? driver? truck? date?) so the dropdown only offers Delete.
export type RouteRowActions = {
  onDelete: (route: Route) => void;
};

export function buildRouteColumns(
  actions?: RouteRowActions,
): ColumnDef<Route>[] {
  return [
    {
      accessorKey: "route_code",
      header: "Route",
      size: 140,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.route_code}</div>
      ),
    },
    {
      accessorKey: "driver_name",
      header: "Driver",
      size: 240,
      cell: ({ row }) => <div>{row.original.driver_name ?? "—"}</div>,
    },
    {
      accessorKey: "truck_type",
      header: "Truck",
      size: 120,
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.truck_type ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "stop_count",
      header: "Stops",
      size: 90,
      cell: ({ row }) => (
        <div className="tabular-nums">{row.original.stop_count}</div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      size: 130,
      cell: ({ row }) => (
        <div className="text-muted-foreground tabular-nums">
          {row.original.date}
        </div>
      ),
    },
    {
      id: "actions",
      size: 56,
      cell: ({ row }) => (
        <div
          className="flex justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                  size="icon"
                />
              }
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => actions?.onDelete(row.original)}
                disabled={!actions}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

// Backwards-compatible export — read-only table without actions.
export const routeColumns = buildRouteColumns();
