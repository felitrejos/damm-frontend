"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { deleteTruck, type Truck } from "@/lib/api/catalog";

import { AddTruckModal } from "./AddTruckModal";
import { EditTruckModal } from "./EditTruckModal";
import { buildTruckColumns } from "./columns";

type TrucksListPageProps = {
  initialTrucks: Truck[];
  initialError?: string;
};

export function TrucksListPage({
  initialTrucks,
  initialError,
}: TrucksListPageProps) {
  const router = useRouter();
  const [trucks] = useState<Truck[]>(initialTrucks);
  const [selected, setSelected] = useState<Truck | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Truck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Truck | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Trucks", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.plate ?? "Unassigned" }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  useChatSurface(
    useMemo(
      () => ({
        surface: "catalog_table",
        centerId: null,
        catalog: "trucks",
        selected: null,
      }),
      [],
    ),
  );

  const columns = useMemo(
    () =>
      buildTruckColumns({
        onEdit: (t) => setEditTarget(t),
        onDelete: (t) => setDeleteTarget(t),
      }),
    [],
  );

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Trucks</h2>
          <p className="body-lg text-ink-muted mt-2">
            Fleet capacity and availability from the backend catalog.
          </p>
        </div>

        {initialError ? (
          <RemoteDataState
            title="Could not load trucks"
            description={initialError}
          />
        ) : trucks.length === 0 ? (
          <RemoteDataState
            title="No trucks found"
            description="The backend returned an empty truck list."
          />
        ) : (
          <DataTable
            data={trucks}
            columns={columns}
            getRowId={(row) => row.id}
            searchColumnId="plate"
            searchPlaceholder="Search trucks..."
            searchAriaLabel="Search trucks"
            filterColumnId="truck_type"
            filterLabel="Filter by type"
            filterMobileLabel="Type"
            addButtonLabel="Add Truck"
            onAdd={() => setAddOpen(true)}
            selectedRowId={selected?.id ?? null}
            onRowClick={(truck) =>
              setSelected((curr) => (curr?.id === truck.id ? null : truck))
            }
          />
        )}
      </div>

      <AddTruckModal open={addOpen} onOpenChange={setAddOpen} />
      <EditTruckModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        truck={editTarget}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete truck?"
        description={`This permanently deletes truck "${deleteTarget?.plate ?? ""}".`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteTruck(deleteTarget.id);
          router.refresh();
        }}
      />
    </PageLayout>
  );
}
