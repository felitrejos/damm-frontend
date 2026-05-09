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

// Inspired by damm-backend TransportSummary: route_code, driver_name, date,
// stop_count, truck_type. `centerId` scopes the route to a specific warehouse
// (Center) — frontend addition.
export const routeSchema = z.object({
  id: z.number(),
  code: z.string(),
  driver_name: z.string(),
  truck_code: z.string(),
  stops: z.number(),
  date: z.string(), // ISO YYYY-MM-DD
  centerId: z.number(),
});

export type Route = z.infer<typeof routeSchema>;

export const routeColumns: ColumnDef<Route>[] = [
  {
    accessorKey: "code",
    header: "Route",
    size: 140,
    cell: ({ row }) => <div className="font-medium">{row.original.code}</div>,
  },
  {
    accessorKey: "driver_name",
    header: "Driver",
    size: 200,
    cell: ({ row }) => <div>{row.original.driver_name}</div>,
  },
  {
    accessorKey: "truck_code",
    header: "Truck",
    size: 120,
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.truck_code}</div>
    ),
  },
  {
    accessorKey: "stops",
    header: "Stops",
    size: 90,
    cell: ({ row }) => (
      <div className="tabular-nums">{row.original.stops}</div>
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
