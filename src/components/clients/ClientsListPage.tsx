"use client";

import { useEffect, useMemo, useState } from "react";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import type { Customer } from "@/lib/api/catalog";
import { clientColumns } from "./columns";

type ClientsListPageProps = {
  initialClients: Customer[];
  initialError?: string;
};

export function ClientsListPage({
  initialClients,
  initialError,
}: ClientsListPageProps) {
  const [clients] = useState<Customer[]>(initialClients);
  const [selected, setSelected] = useState<Customer | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Clients", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.name }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  useChatSurface(
    useMemo(
      () => ({
        surface: "catalog_table",
        centerId: null,
        catalog: "clients",
        selected: null,
      }),
      [],
    ),
  );

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Clients</h2>
          <p className="body-lg text-ink-muted mt-2">
            Customer addresses and geocoding status from the backend catalog.
          </p>
        </div>

        {initialError ? (
          <RemoteDataState
            title="Could not load clients"
            description={initialError}
          />
        ) : clients.length === 0 ? (
          <RemoteDataState
            title="No clients found"
            description="The backend returned an empty customer list."
          />
        ) : (
          <DataTable
            data={clients}
            columns={clientColumns}
            getRowId={(row) => row.id}
            searchColumnId="name"
            searchPlaceholder="Search clients..."
            searchAriaLabel="Search clients"
            filterColumnId="city"
            filterLabel="Filter by city"
            filterMobileLabel="City"
            selectedRowId={selected?.id ?? null}
            onRowClick={(client) =>
              setSelected((curr) => (curr?.id === client.id ? null : client))
            }
          />
        )}
      </div>
    </PageLayout>
  );
}
