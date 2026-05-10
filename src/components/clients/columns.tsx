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
import type { Customer } from "@/lib/api/catalog";

export type ClientRowActions = {
  onEdit: (client: Customer) => void;
  onDelete: (client: Customer) => void;
};

export function buildClientColumns(
  actions?: ClientRowActions,
): ColumnDef<Customer>[] {
  return [
    {
      accessorKey: "name",
      header: "Client",
      size: 280,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
      size: 180,
      filterFn: (row, columnId, filterValue) => {
        const values = filterValue as string[] | undefined;
        if (!values?.length) return true;
        return values.includes(row.getValue(columnId) as string);
      },
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.city ?? "Unknown"}
        </div>
      ),
    },
    {
      accessorKey: "postal_code",
      header: "Postal code",
      size: 140,
      cell: ({ row }) => (
        <div className="tabular-nums">{row.original.postal_code ?? "-"}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      size: 320,
      cell: ({ row }) => (
        <div className="max-w-[28rem] truncate text-muted-foreground">
          {row.original.address ?? "No address"}
        </div>
      ),
    },
    {
      id: "geocoded",
      header: "Geo",
      size: 100,
      cell: ({ row }) => {
        const geocoded = row.original.lat != null && row.original.lng != null;
        return (
          <span
            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
              geocoded
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {geocoded ? "Ready" : "Missing"}
          </span>
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
export const clientColumns = buildClientColumns();
