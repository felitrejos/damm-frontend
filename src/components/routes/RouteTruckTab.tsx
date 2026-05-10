"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  IconBoxSeam,
  IconCube3dSphere,
  IconRulerMeasure,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { palletDisplayColor } from "./palletColor";
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
  // Count only real cargo pallets — empty placeholders (rendered as bare
  // bases for capacity context) shouldn't inflate the load percentage.
  const used = visualization.pallets.filter(
    (p) => !p.is_empty && p.products.length > 0,
  ).length;
  const utilization =
    capacityPallets > 0 ? Math.round((used / capacityPallets) * 100) : 0;

  // Hover state is shared between the 3D scene and the sidebar list so a
  // pointer hovering either side highlights the matching pallet on both.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Selection persists across pointer-out and drives the list expansion.
  // Click again on the same pallet (or on empty canvas) to clear.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Selection takes priority for the highlight: when something is selected,
  // hover does not move the focus until the user deselects.
  const focusId = selectedId ?? hoveredId;

  const handleSelectPallet = (id: string | null) => {
    if (id === null) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
      <div
        className={cn(
          "relative h-full min-h-[360px] overflow-hidden rounded-lg border border-border bg-canvas",
          hoveredId ? "cursor-pointer" : "cursor-default",
        )}
      >
        <TruckWireframeScene
          visualization={visualization}
          hoveredPalletId={focusId}
          onHoverPallet={setHoveredId}
          onSelectPallet={handleSelectPallet}
        />
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
        <PalletList
          pallets={visualization.pallets}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={handleSelectPallet}
        />
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

type PalletListProps = {
  pallets: VizPallet[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
};

function PalletList({
  pallets,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: PalletListProps) {
  // Empty slot placeholders (no products) are rendered as bare bases in the
  // 3D scene to fill the truck up to capacity, but they shouldn't show up
  // here as if they were real cargo entries.
  const realPallets = pallets.filter(
    (p) => !p.is_empty && p.products.length > 0,
  );
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        Visible pallets
      </span>
      <ol className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {realPallets.map((pallet) => {
          const isSelected = selectedId === pallet.pallet_id;
          const active = isSelected || hoveredId === pallet.pallet_id;
          const swatch = palletDisplayColor(pallet);
          const summary = pallet.products.map((p) => p.name).join(" · ");
          return (
            <li
              key={pallet.pallet_id}
              onMouseEnter={() => onHover(pallet.pallet_id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(pallet.pallet_id)}
              className={cn(
                "rounded-md border transition-colors cursor-pointer",
                active
                  ? "border-white/30 bg-surface-3"
                  : "border-border bg-surface-1 hover:border-white/15",
              )}
            >
              <div className="flex items-start gap-2.5 px-2.5 py-2">
                <span
                  aria-hidden
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: swatch,
                    boxShadow: active
                      ? `0 0 18px ${swatch}`
                      : `0 0 12px ${swatch}`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    {pallet.sequence != null && (
                      <span className="text-[11px] font-semibold tabular-nums text-ink-tertiary">
                        #{pallet.sequence}
                      </span>
                    )}
                    <span className="truncate text-[13px] font-medium text-ink">
                      {pallet.customer_name || pallet.pallet_id}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "text-[12px] text-ink-subtle",
                      isSelected ? "" : "truncate",
                    )}
                  >
                    {summary}
                  </div>
                </div>
              </div>
              {isSelected && <PalletDetail pallet={pallet} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const UNIT_LABEL: Record<string, string> = {
  CAJ: "cases",
  BRL: "barrels",
  UN: "units",
  PAK: "packs",
};

function PalletDetail({ pallet }: { pallet: VizPallet }) {
  return (
    <div className="border-t border-border/60 px-2.5 py-2">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
          Contents
        </span>
        {pallet.is_return && (
          <span className="rounded bg-surface-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-subtle">
            return
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {pallet.products.map((product) => (
          <li
            key={product.sku}
            className="flex items-start gap-1.5 text-[12px] text-ink"
          >
            <span
              aria-hidden
              className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-subtle"
            />
            <span className="min-w-0 flex-1">{product.name}</span>
            <span className="shrink-0 tabular-nums text-ink-subtle">
              {product.cases}{" "}
              {UNIT_LABEL[product.unit] ?? product.unit.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
      {(pallet.total_weight_kg > 0 || pallet.total_volume_l > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
          {pallet.total_weight_kg > 0 && (
            <span>
              <span className="text-ink-tertiary">Weight: </span>
              <span className="tabular-nums">{pallet.total_weight_kg} kg</span>
            </span>
          )}
          {pallet.total_volume_l > 0 && (
            <span>
              <span className="text-ink-tertiary">Volume: </span>
              <span className="tabular-nums">{pallet.total_volume_l} L</span>
            </span>
          )}
        </div>
      )}
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
