"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Joined view of an order — flattens customer/material/type lookups so
// table cells can render directly without re-resolving per row. Built in
// OrdersListPage from the four catalog calls.
export type OrderRow = {
  id: string;
  customer_id: string;
  customer_name: string;
  material_id: string;
  material_description: string;
  material_type: string;
  due_date: string;
  quantity: number;
  unit: string;
  delivered: boolean;
};

const multiFacetFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: unknown,
): boolean => {
  const values = filterValue as string[] | undefined;
  if (!values?.length) return true;
  return values.includes(row.getValue(columnId) as string);
};

export const orderColumns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "customer_name",
    header: "Customer",
    size: 260,
    cell: ({ row }) => (
      <div className="font-medium">{row.original.customer_name}</div>
    ),
  },
  {
    accessorKey: "material_description",
    header: "Material",
    size: 320,
    cell: ({ row }) => (
      <div className="max-w-[28rem] truncate text-muted-foreground">
        {row.original.material_description}
      </div>
    ),
  },
  {
    accessorKey: "material_type",
    header: "Type",
    size: 160,
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.material_type}</div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    size: 100,
    cell: ({ row }) => (
      <div className="tabular-nums">{row.original.quantity}</div>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    size: 100,
    filterFn: multiFacetFilter,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground">
        {row.original.unit || "—"}
      </div>
    ),
  },
  {
    accessorKey: "due_date",
    header: "Due date",
    size: 140,
    filterFn: multiFacetFilter,
    cell: ({ row }) => (
      <div className="tabular-nums text-muted-foreground">
        {row.original.due_date || "—"}
      </div>
    ),
  },
  {
    accessorKey: "delivered",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
          row.original.delivered
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {row.original.delivered ? "Delivered" : "Pending"}
      </span>
    ),
  },
];
