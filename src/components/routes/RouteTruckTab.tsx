"use client";

import dynamic from "next/dynamic";
import { IconBoxSeam, IconCube3dSphere, IconRulerMeasure } from "@tabler/icons-react";

import type { TruckVisualization, VizPallet } from "./types";

// React-three-fiber relies on `window` and a real WebGL context, so it must
// not run during server rendering. Dynamic + ssr:false keeps the bundle out
// of the SSR pass and shows a placeholder while the chunk loads.
const TruckWireframeScene = dynamic(
  () =>
    import("./TruckWireframeScene").then((mod) => ({
      default: mod.TruckWireframeScene,
    })),
  {
    ssr: false,
    loading: () => <SceneSkeleton />,
  },
);

type RouteTruckTabProps = {
  visualization: TruckVisualization;
  capacityPallets: number;
};

export function RouteTruckTab({
  visualization,
  capacityPallets,
}: RouteTruckTabProps) {
  const used = visualization.pallets.length;
  const utilization = capacityPallets > 0
    ? Math.round((used / capacityPallets) * 100)
    : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
      <div className="relative h-full min-h-[360px] overflow-hidden rounded-lg border border-border bg-canvas">
        <TruckWireframeScene visualization={visualization} />
      </div>

      <aside className="flex min-h-0 flex-col gap-3" aria-label="Truck load summary">
        <StatGrid
          stats={[
            {
              label: "Slots",
              value: `${used}/${capacityPallets}`,
              Icon: IconCube3dSphere,
            },
            {
              label: "Length",
              value: `${visualization.truck_dims.length_cm} cm`,
              Icon: IconRulerMeasure,
            },
            {
              label: "Width",
              value: `${visualization.truck_dims.width_cm} cm`,
              Icon: IconRulerMeasure,
            },
            {
              label: "Load",
              value: `${utilization}%`,
              Icon: IconBoxSeam,
            },
          ]}
        />
        <PalletList pallets={visualization.pallets} />
      </aside>
    </div>
  );
}

type Stat = {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(({ label, value, Icon }) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-md border border-border bg-surface-2 px-3 py-2.5"
        >
          <Icon className="size-3.5 text-ink-subtle" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
            {label}
          </span>
          <span className="text-[15px] font-semibold tabular-nums text-ink">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PalletList({ pallets }: { pallets: VizPallet[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        Visible pallets
      </span>
      <ol className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {pallets.map((pallet) => (
          <li
            key={pallet.pallet_id}
            className="flex items-start gap-2.5 rounded-md border border-border bg-surface-1 px-2.5 py-2"
          >
            <span
              aria-hidden
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: pallet.color,
                boxShadow: `0 0 12px ${pallet.color}`,
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">
                {pallet.label}
              </div>
              <div className="truncate text-[12px] text-ink-subtle">
                {pallet.products_summary.join(" · ")}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SceneSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-canvas text-[12px] text-ink-tertiary">
      Loading 3D scene…
    </div>
  );
}
