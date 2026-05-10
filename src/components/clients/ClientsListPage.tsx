"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { deleteCustomer, type Customer } from "@/lib/api/catalog";

import { AddClientModal } from "./AddClientModal";
import { EditClientModal } from "./EditClientModal";
import { buildClientColumns } from "./columns";

type ClientsListPageProps = {
  initialClients: Customer[];
  initialError?: string;
};

export function ClientsListPage({
  initialClients,
  initialError,
}: ClientsListPageProps) {
  const router = useRouter();
  const [clients] = useState<Customer[]>(initialClients);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
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

  const columns = useMemo(
    () =>
      buildClientColumns({
        onEdit: (c) => setEditTarget(c),
        onDelete: (c) => setDeleteTarget(c),
      }),
    [],
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
            columns={columns}
            getRowId={(row) => row.id}
            searchColumnId="name"
            searchPlaceholder="Search clients..."
            searchAriaLabel="Search clients"
            filterColumnId="city"
            filterLabel="Filter by city"
            filterMobileLabel="City"
            addButtonLabel="Add Client"
            onAdd={() => setAddOpen(true)}
            selectedRowId={selected?.id ?? null}
            onRowClick={(client) =>
              setSelected((curr) => (curr?.id === client.id ? null : client))
            }
          />
        )}
      </div>

      <AddClientModal open={addOpen} onOpenChange={setAddOpen} />
      <EditClientModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        client={editTarget}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete client?"
        description={`This permanently deletes "${deleteTarget?.name ?? ""}" from the customer catalog.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCustomer(deleteTarget.id);
          router.refresh();
        }}
      />
    </PageLayout>
  );
}
