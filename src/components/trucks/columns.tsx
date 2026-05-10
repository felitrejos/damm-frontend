"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truckTypeFor, type Truck } from "@/lib/api/catalog";

export type { Truck };

export type TruckRowActions = {
  onEdit: (truck: Truck) => void;
  onDelete: (truck: Truck) => void;
};

export function buildTruckColumns(
  actions?: TruckRowActions,
): ColumnDef<Truck>[] {
  return [
    {
      accessorKey: "plate",
      header: "Plate",
      size: 220,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.plate ?? "Unassigned"}</div>
      ),
    },
    {
      id: "truck_type",
      header: "Type",
      size: 140,
      accessorFn: (row) => truckTypeFor(row.capacity_pallets),
      filterFn: (row, columnId, filterValue) => {
        const values = filterValue as string[] | undefined;
        if (!values?.length) return true;
        return values.includes(row.getValue(columnId) as string);
      },
      cell: ({ row }) => (
        <div>{truckTypeFor(row.original.capacity_pallets)}</div>
      ),
    },
    {
      accessorKey: "capacity_pallets",
      header: "Pallets",
      size: 120,
      cell: ({ row }) => (
        <div className="tabular-nums">{row.original.capacity_pallets}</div>
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
                onClick={() => actions?.onEdit(row.original)}
                disabled={!actions}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
export const truckColumns = buildTruckColumns();
