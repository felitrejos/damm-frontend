"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Driver } from "@/lib/api/catalog";

export type { Driver };

export const driverColumns: ColumnDef<Driver>[] = [
  {
    accessorKey: "name",
    header: "Driver",
    size: 300,
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "code",
    header: "Code",
    size: 180,
    cell: ({ row }) => (
      <div className="tabular-nums text-muted-foreground">
        {row.original.code}
      </div>
    ),
  },
];
