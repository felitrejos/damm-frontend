"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Truck } from "@/lib/api/catalog";

export const truckColumns: ColumnDef<Truck>[] = [
  {
    accessorKey: "code",
    header: "Truck",
    size: 300,
    cell: ({ row }) => <div className="font-medium">{row.original.code}</div>,
  },
  {
    accessorKey: "plate",
    header: "Plate",
    size: 180,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.plate ?? "Unassigned"}
      </div>
    ),
  },
  {
    accessorKey: "truck_type",
    header: "Type",
    size: 140,
    filterFn: (row, columnId, filterValue) => {
      const values = filterValue as string[] | undefined;
      if (!values?.length) return true;
      return values.includes(row.getValue(columnId) as string);
    },
    cell: ({ row }) => <div>{row.original.truck_type}</div>,
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
    accessorKey: "active",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
          row.original.active
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {row.original.active ? "Active" : "Inactive"}
      </span>
    ),
  },
];
