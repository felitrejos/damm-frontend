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
      id: "schedule",
      header: "Start",
      size: 140,
      cell: ({ row }) => {
        const start = row.original.start_time;
        if (!start) return <div className="text-muted-foreground">—</div>;
        const dur = row.original.duration_min;
        const end = dur != null ? addMinutesHHMM(start, dur) : null;
        return (
          <div className="tabular-nums text-muted-foreground">
            {start}
            {end ? <span className="text-ink-tertiary"> → {end}</span> : null}
          </div>
        );
      },
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

// "HH:MM" + minutes → "HH:MM" wrapping at 24h. Used to derive the route's
// end time from start + duration for the schedule column.
function addMinutesHHMM(hhmm: string, minutes: number): string | null {
  const parts = hhmm.split(":");
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const total = (h * 60 + m + minutes + 24 * 60) % (24 * 60);
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}
