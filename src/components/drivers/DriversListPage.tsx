"use client";

import { useEffect, useMemo, useState } from "react";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import type { Driver } from "@/lib/api/catalog";
import { driverColumns } from "./columns";

type DriversListPageProps = {
  initialDrivers: Driver[];
  initialError?: string;
};

export function DriversListPage({
  initialDrivers,
  initialError,
}: DriversListPageProps) {
  const [drivers] = useState<Driver[]>(initialDrivers);
  const [selected, setSelected] = useState<Driver | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Drivers", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.name }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  useChatSurface(
    useMemo(
      () => ({
        surface: "catalog_table",
        centerId: null,
        catalog: "drivers",
        selected: null,
      }),
      [],
    ),
  );

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Drivers</h2>
          <p className="body-lg text-ink-muted mt-2">
            Driver records loaded from the backend operational database.
          </p>
        </div>

        {initialError ? (
          <RemoteDataState
            title="Could not load drivers"
            description={initialError}
          />
        ) : drivers.length === 0 ? (
          <RemoteDataState
            title="No drivers found"
            description="The backend returned an empty driver list."
          />
        ) : (
          <DataTable
            data={drivers}
            columns={driverColumns}
            getRowId={(row) => row.id}
            searchColumnId="name"
            searchPlaceholder="Search drivers..."
            searchAriaLabel="Search drivers"
            selectedRowId={selected?.id ?? null}
            onRowClick={(driver) =>
              setSelected((curr) => (curr?.id === driver.id ? null : driver))
            }
          />
        )}
      </div>
    </PageLayout>
  );
}
