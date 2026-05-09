"use client";

import { useEffect, useState } from "react";

import { DataTable } from "@/components/shared/DataTable";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { centerColumns, type Center } from "./columns";
import { sampleCenters } from "./sample-data";

export function CentersListPage() {
  const [selected, setSelected] = useState<Center | null>(null);
  const { setCrumbs } = useBreadcrumb();

  useEffect(() => {
    setCrumbs([
      { label: "Centers", onClick: () => setSelected(null) },
      ...(selected ? [{ label: selected.center }] : []),
    ]);
    return () => setCrumbs([]);
  }, [selected, setCrumbs]);

  return (
    <PageLayout>
      <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
        <div>
          <h2 className="headline text-ink">Pick a center</h2>
          <p className="body-lg text-ink-muted mt-2">
            Start a new plan by choosing the distribution center you&apos;ll
            dispatch from.
          </p>
        </div>
        <DataTable
          data={sampleCenters}
          columns={centerColumns}
          getRowId={(row) => row.id.toString()}
          searchColumnId="center"
          searchPlaceholder="Search centers..."
          searchAriaLabel="Search centers"
          filterColumnId="location"
          filterLabel="Filter by location"
          filterMobileLabel="Location"
          addButtonLabel="Add Center"
          selectedRowId={selected?.id.toString() ?? null}
          onRowClick={(c) =>
            setSelected((curr) => (curr?.id === c.id ? null : c))
          }
        />
      </div>
    </PageLayout>
  );
}
