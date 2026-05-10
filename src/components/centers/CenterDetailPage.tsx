"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useChatSurface } from "@/components/chat/ChatSurfaceProvider";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable } from "@/components/shared/DataTable";
import { PageLayout } from "@/components/shell/PageLayout";
import { useBreadcrumb } from "@/components/shell/breadcrumb";
import { AddRouteModal } from "@/components/routes/AddRouteModal";
import { buildRouteColumns, type Route } from "@/components/routes/columns";
import { RouteHero } from "@/components/routes/RouteHero";
import { deleteTransport } from "@/lib/api/transports";
import type { PlannerChatContext } from "@/lib/chat/types";

import type { Center } from "./columns";

type Props = {
  center: Center;
  routes: Route[];
};

export function CenterDetailPage({ center, routes }: Props) {
  const router = useRouter();
  const { setCrumbs } = useBreadcrumb();

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Route | null>(null);

  useEffect(() => {
    setCrumbs([
      { label: "Centers", onClick: () => router.push("/") },
      { label: center.name, onClick: () => setSelectedRoute(null) },
      ...(selectedRoute ? [{ label: selectedRoute.route_code }] : []),
    ]);
    return () => setCrumbs([]);
  }, [center, selectedRoute, setCrumbs, router]);

  const chatContext = useMemo<PlannerChatContext>(
    () =>
      selectedRoute
        ? {
            surface: "route_overview",
            centerId: center.id,
            selected: { kind: "route", routeId: selectedRoute.transport_id },
          }
        : {
            surface: "center_routes_table",
            centerId: center.id,
            selected: null,
          },
    // addRouteOpen forces a fresh reference when the modal closes, so the
    // chat surface re-publishes after AddRouteModal resets it back to null.
    [center.id, selectedRoute, addRouteOpen],
  );
  useChatSurface(chatContext);

  const columns = useMemo(
    () =>
      buildRouteColumns({
        onDelete: (r) => setDeleteTarget(r),
      }),
    [],
  );

  return (
    <PageLayout>
      {selectedRoute ? (
        <div className="flex h-full min-h-0 flex-col px-6 md:px-10 pt-5 pb-5">
          <RouteHero route={selectedRoute} center={center} />
        </div>
      ) : (
        <div className="px-6 md:px-10 pt-8 pb-10 flex flex-col gap-7">
          <div>
            <h2 className="headline text-ink">{center.name}</h2>
            <p className="body-lg text-ink-muted mt-2">
              Routes dispatched from this center. Add a new one or open an
              existing route to inspect its plan.
            </p>
          </div>

          <DataTable
            data={routes}
            columns={columns}
            getRowId={(row) => row.transport_id}
            searchColumnId="route_code"
            searchPlaceholder="Search routes..."
            searchAriaLabel="Search routes"
            addButtonLabel="Add Route"
            onAdd={() => setAddRouteOpen(true)}
            selectedRowId={null}
            onRowClick={(r) => setSelectedRoute(r)}
          />
        </div>
      )}

      <AddRouteModal
        open={addRouteOpen}
        onOpenChange={setAddRouteOpen}
        centerId={center.id}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete route?"
        description={`This permanently deletes the transport "${deleteTarget?.route_code ?? ""}" scheduled for ${deleteTarget?.date ?? ""}.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteTransport(deleteTarget.transport_id);
          router.refresh();
        }}
      />
    </PageLayout>
  );
}
