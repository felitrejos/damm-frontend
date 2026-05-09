"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TruckType } from "@/lib/schemas/domain";

export const schema = z.object({
  id: z.number(),
  center_id: z.number(),
  transport_id: z.string(),
  route_code: z.string(),
  driver_name: z.string(),
  truck_type: TruckType,
  date: z.string(),
  stops: z.number(),
  distance_km: z.number(),
  duration_min: z.number(),
});

export type Route = z.infer<typeof schema>;

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const routeColumns: ColumnDef<Route>[] = [
  {
    accessorKey: "route_code",
    header: "Route",
    size: 200,
    cell: ({ row }) => (
      <div className="font-medium">{row.original.route_code}</div>
    ),
  },
  {
    accessorKey: "driver_name",
    header: "Driver",
    size: 220,
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.driver_name}</div>
    ),
  },
  {
    accessorKey: "truck_type",
    header: "Truck",
    size: 120,
    filterFn: (row, columnId, filterValue) => {
      const arr = filterValue as string[] | undefined;
      if (!arr || arr.length === 0) return true;
      return arr.includes(row.getValue(columnId) as string);
    },
    cell: ({ row }) => (
      <div className="font-mono text-[12px] uppercase tracking-wide text-ink-subtle">
        {row.original.truck_type}
      </div>
    ),
  },
  {
    accessorKey: "stops",
    header: "Stops",
    size: 100,
    cell: ({ row }) => (
      <div className="tabular-nums">{row.original.stops}</div>
    ),
  },
  {
    accessorKey: "distance_km",
    header: "Distance",
    size: 140,
    cell: ({ row }) => (
      <div className="tabular-nums">
        {row.original.distance_km.toFixed(1)} km
      </div>
    ),
  },
  {
    accessorKey: "duration_min",
    header: "Duration",
    size: 140,
    cell: ({ row }) => (
      <div className="tabular-nums">
        {formatDuration(row.original.duration_min)}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    size: 140,
    cell: ({ row }) => (
      <div className="text-muted-foreground tabular-nums">
        {row.original.date}
      </div>
    ),
  },
  {
    id: "actions",
    size: 56,
    cell: () => (
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
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
