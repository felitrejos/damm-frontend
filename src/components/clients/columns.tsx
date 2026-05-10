"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Customer } from "@/lib/api/catalog";

export const clientColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Client",
    size: 300,
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
    size: 120,
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
];
