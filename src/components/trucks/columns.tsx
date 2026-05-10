"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { truckTypeFor, type Truck } from "@/lib/api/catalog";

export type { Truck };

export const truckColumns: ColumnDef<Truck>[] = [
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
    cell: ({ row }) => <div>{truckTypeFor(row.original.capacity_pallets)}</div>,
  },
  {
    accessorKey: "capacity_pallets",
    header: "Pallets",
    size: 120,
    cell: ({ row }) => (
      <div className="tabular-nums">{row.original.capacity_pallets}</div>
    ),
  },
];
