"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable } from "@/components/shared/DataTable";
import { RemoteDataState } from "@/components/shared/RemoteDataState";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { deleteDriver, type DriverWithZones } from "@/lib/api/catalog";

import { AddDriverModal } from "./AddDriverModal";
import { EditDriverModal } from "./EditDriverModal";
import { buildDriverColumns } from "./columns";

type DriversListPageProps = {
  initialDrivers: DriverWithZones[];
  initialError?: string;
};

export function DriversListPage({
  initialDrivers,
  initialError,
}: DriversListPageProps) {
  const router = useRouter();
  const [drivers] = useState<DriverWithZones[]>(initialDrivers);
  const [selected, setSelected] = useState<DriverWithZones | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DriverWithZones | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverWithZones | null>(
    null,
  );
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

  const columns = useMemo(
    () =>
      buildDriverColumns({
        onEdit: (d) => setEditTarget(d),
        onDelete: (d) => setDeleteTarget(d),
      }),
    [],
  );

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Drivers</h2>
          <p className="body-lg text-ink-muted mt-2">
            Driver records and the zones each one knows best — derived from
            their delivery history.
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
            columns={columns}
            getRowId={(row) => row.id}
            searchColumnId="name"
            searchPlaceholder="Search drivers..."
            searchAriaLabel="Search drivers"
            addButtonLabel="Add Driver"
            onAdd={() => setAddOpen(true)}
            selectedRowId={selected?.id ?? null}
            onRowClick={(driver) =>
              setSelected((curr) => (curr?.id === driver.id ? null : driver))
            }
          />
        )}
      </div>

      <AddDriverModal open={addOpen} onOpenChange={setAddOpen} />
      <EditDriverModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        driver={editTarget}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete driver?"
        description={`This permanently deletes driver "${deleteTarget?.name ?? ""}".`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteDriver(deleteTarget.id);
          router.refresh();
        }}
      />
    </PageLayout>
  );
}
