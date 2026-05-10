"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCalendar, IconChevronDown } from "@tabler/icons-react";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { orderColumns, type OrderRow } from "./columns";

type OrdersListPageProps = {
  rows: OrderRow[];
  initialError?: string;
};

export function OrdersListPage({ rows, initialError }: OrdersListPageProps) {
  const { setCrumbs } = useBreadcrumb();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    setCrumbs([{ label: "Orders" }]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  useChatSurface(
    useMemo(
      () => ({
        surface: "catalog_table",
        centerId: null,
        catalog: "orders",
        selected: null,
      }),
      [],
    ),
  );

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.due_date) set.add(r.due_date);
    return Array.from(set).sort();
  }, [rows]);

  // Date filter is applied before the table sees the rows (rather than via a
  // tanstack column filter) so the material-type facet counts only reflect
  // the day(s) currently selected.
  const filteredRows = useMemo(() => {
    if (!selectedDates.length) return rows;
    const wanted = new Set(selectedDates);
    return rows.filter((r) => wanted.has(r.due_date));
  }, [rows, selectedDates]);

  const toggleDate = (value: string, checked: boolean) => {
    setSelectedDates((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Orders</h2>
          <p className="body-lg text-ink-muted mt-2">
            Customer orders pending dispatch, joined with material catalog.
          </p>
        </div>

        {initialError ? (
          <RemoteDataState
            title="Could not load orders"
            description={initialError}
          />
        ) : rows.length === 0 ? (
          <RemoteDataState
            title="No orders found"
            description="The backend returned an empty orders list."
          />
        ) : (
          <DataTable
            data={filteredRows}
            columns={orderColumns}
            getRowId={(row) => row.id}
            searchColumnId="customer_name"
            searchPlaceholder="Search by customer..."
            searchAriaLabel="Search orders"
            filterColumnId="unit"
            filterLabel="Filter by unit"
            filterMobileLabel="Unit"
            toolbarTrailing={
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <IconCalendar />
                  <span className="hidden lg:inline">Filter by day</span>
                  <span className="lg:hidden">Day</span>
                  {selectedDates.length > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                      {selectedDates.length}
                    </span>
                  ) : null}
                  <IconChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-80 w-56 overflow-y-auto"
                >
                  {availableDates.map((value) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      className="min-h-8 text-sm tabular-nums"
                      checked={selectedDates.includes(value)}
                      onCheckedChange={(checked) =>
                        toggleDate(value, !!checked)
                      }
                    >
                      <span className="truncate">{value}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        )}
      </div>
    </PageLayout>
  );
}
