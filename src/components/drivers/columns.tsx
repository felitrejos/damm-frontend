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
import type { DriverWithZones } from "@/lib/api/catalog";

// Re-export so list page consumers don't need to know whether the row carries
// zone history (it does — drivers are read from /api/v1/data/drivers).
export type Driver = DriverWithZones;

export type DriverRowActions = {
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
};

const TOP_ZONES_TO_SHOW = 3;

export function buildDriverColumns(
  actions?: DriverRowActions,
): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "name",
      header: "Driver",
      size: 280,
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      id: "top_zones",
      header: "Familiar zones",
      size: 360,
      cell: ({ row }) => {
        const zones = row.original.top_zones.slice(0, TOP_ZONES_TO_SHOW);
        if (zones.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {zones.map((z) => (
              <span
                key={z.zone_code}
                title={`${z.visits} historical deliveries to ${z.zone_code}`}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <span className="font-mono">{z.zone_code}</span>
                <span className="tabular-nums text-ink-tertiary">
                  {z.visits}
                </span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "total_visits",
      header: "Total deliveries",
      size: 160,
      cell: ({ row }) => (
        <div className="tabular-nums text-muted-foreground">
          {row.original.total_visits}
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
export const driverColumns = buildDriverColumns();
