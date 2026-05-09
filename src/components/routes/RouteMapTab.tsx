"use client";

import { IconMap2 } from "@tabler/icons-react";

import type { Route } from "./columns";

// Placeholder for the map tab. Owned by another teammate.
//
// Suggested wiring (per wiki/contracts/api-contract.md and data-models.md):
//   - Subscribe to the route's WebSocket job (`progress` / `partial` / `result`).
//   - Render `RouteResult.ordered_stops` as numbered pins.
//   - Render `route_geojson` (when present) as the route polyline.
//   - Use mapcn + MapLibre per wiki/frontend/agent-instructions.md.

type RouteMapTabProps = {
  route: Route;
};

export function RouteMapTab({ route }: RouteMapTabProps) {
  return (
    <div className="relative aspect-[16/10] min-h-[360px] overflow-hidden rounded-lg border border-border bg-surface-2">
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="grid size-11 place-items-center rounded-md border border-border bg-surface-3 text-ink-subtle">
            <IconMap2 className="size-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Map view — coming soon
            </h3>
            <p className="mt-1 max-w-sm text-[12px] text-ink-subtle">
              Stops, route polyline and depot for{" "}
              <span className="font-medium text-ink-muted">
                {route.code}
              </span>{" "}
              will render here. Implementation pending (mapcn + MapLibre).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
