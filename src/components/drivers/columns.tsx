"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Driver } from "@/lib/api/catalog";

export type { Driver };

export const driverColumns: ColumnDef<Driver>[] = [
  {
    accessorKey: "name",
    header: "Driver",
    size: 480,
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
];
