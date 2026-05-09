"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import type { Truck } from "@/lib/api/catalog";
import { truckColumns } from "./columns";

type TrucksListPageProps = {
  initialTrucks: Truck[];
};

export function TrucksListPage({ initialTrucks }: TrucksListPageProps) {
  const [trucks] = useState<Truck[]>(initialTrucks);
  const [selected, setSelected] = useState<Truck | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Trucks", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.code }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Trucks</h2>
          <p className="body-lg text-ink-muted mt-2">
            Fleet capacity and availability from the backend catalog.
          </p>
        </div>

        {trucks.length === 0 ? (
          <RemoteDataState
            title="No trucks found"
            description="The backend returned an empty truck list."
          />
        ) : (
          <DataTable
            data={trucks}
            columns={truckColumns}
            getRowId={(row) => row.id.toString()}
            searchColumnId="code"
            searchPlaceholder="Search trucks..."
            searchAriaLabel="Search trucks"
            filterColumnId="truck_type"
            filterLabel="Filter by type"
            filterMobileLabel="Type"
            selectedRowId={selected?.id.toString() ?? null}
            onRowClick={(truck) =>
              setSelected((curr) => (curr?.id === truck.id ? null : truck))
            }
          />
        )}
      </div>
    </PageLayout>
  );
}
