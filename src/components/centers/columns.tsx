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
import type { Warehouse } from "@/lib/api/warehouses";

// "Center" is just the UI label for a backend warehouse.
export type Center = Warehouse;

export type CenterRowActions = {
  onEdit: (center: Center) => void;
  onDelete: (center: Center) => void;
};

export function buildCenterColumns(
  actions?: CenterRowActions,
): ColumnDef<Center>[] {
  return [
    {
      accessorKey: "name",
      header: "Center",
      size: 360,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
      size: 220,
      filterFn: (row, columnId, filterValue) => {
        const arr = filterValue as string[] | undefined;
        if (!arr || arr.length === 0) return true;
        return arr.includes((row.getValue(columnId) as string) ?? "");
      },
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.city ?? "—"}</div>
      ),
    },
    {
      accessorKey: "postal_code",
      header: "Postal code",
      size: 140,
      cell: ({ row }) => (
        <div className="tabular-nums">{row.original.postal_code ?? "—"}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      size: 320,
      cell: ({ row }) => (
        <div className="max-w-[28rem] truncate text-muted-foreground">
          {row.original.address ?? "—"}
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
export const centerColumns = buildCenterColumns();
