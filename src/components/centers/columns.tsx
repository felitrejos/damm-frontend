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

// `lat`/`lng` mirror backend `Warehouse` (damm-backend/models/catalog.py:9)
// — used as the route depot in the map view.
export const schema = z.object({
  id: z.number(),
  center: z.string(),
  location: z.string(),
  routes: z.number(),
  admin: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type Center = z.infer<typeof schema>;

export const centerColumns: ColumnDef<Center>[] = [
  {
    accessorKey: "center",
    header: "Center",
    size: 300,
    cell: ({ row }) => (
      <div className="font-medium">{row.original.center}</div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    size: 180,
    filterFn: (row, columnId, filterValue) => {
      const arr = filterValue as string[] | undefined;
      if (!arr || arr.length === 0) return true;
      return arr.includes(row.getValue(columnId) as string);
    },
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.location}</div>
    ),
  },
  {
    accessorKey: "routes",
    header: "Routes",
    size: 140,
    cell: ({ row }) => (
      <div className="tabular-nums">{row.original.routes}</div>
    ),
  },
  {
    accessorKey: "admin",
    header: "Admin",
    size: 320,
    cell: ({ row }) => <div>{row.original.admin}</div>,
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
