"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import {
  IconBoxSeam,
  IconCube,
  IconCube3dSphere,
  IconMinus,
  IconPlus,
  IconRotate360,
} from "@tabler/icons-react";
import type { Vector3 } from "three";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { palletDisplayColor } from "./palletColor";
import type { TruckViewMode } from "./TruckWireframeScene";
import type { TruckVisualization, VizPallet } from "./types";

// Minimal shape we touch on drei's OrbitControls — enough for dolly without
// pulling three-stdlib types into this file. `zoom` is only present on
// orthographic cameras; we read it dynamically when in iso mode.
type OrbitControlsHandle = {
  object: {
    position: Vector3;
    zoom?: number;
    isOrthographicCamera?: boolean;
    updateProjectionMatrix?: () => void;
  };
  target: Vector3;
  update: () => void;
};

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
  const utilization =
    capacityPallets > 0 ? Math.round((used / capacityPallets) * 100) : 0;

  // Hover state is shared between the 3D scene and the sidebar list so a
  // pointer hovering either side highlights the matching pallet on both.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Camera mode: "orbit" = free perspective with OrbitControls (default),
  // "iso" = fixed isometric orthographic (Cinema 4D "Parallel" projection).
  const [viewMode, setViewMode] = useState<TruckViewMode>("orbit");

  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  // Imperative zoom: perspective cameras dolly along the view vector;
  // orthographic cameras scale `camera.zoom` (no concept of distance).
  const zoomBy = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    if (c.object.isOrthographicCamera) {
      const current = c.object.zoom ?? 1;
      c.object.zoom = current / factor;
      c.object.updateProjectionMatrix?.();
      return;
    }
    const offset = c.object.position.clone().sub(c.target);
    offset.multiplyScalar(factor);
    c.object.position.copy(c.target).add(offset);
    c.update();
  };

  const isIso = viewMode === "iso";
  const toggleViewMode = () => setViewMode(isIso ? "orbit" : "iso");

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
      <div
        className={cn(
          "relative aspect-[16/10] min-h-[360px] overflow-hidden rounded-lg border border-border bg-canvas",
          hoveredId ? "cursor-pointer" : "cursor-default",
        )}
      >
        <TruckWireframeScene
          visualization={visualization}
          hoveredPalletId={hoveredId}
          onHoverPallet={setHoveredId}
          controlsRef={controlsRef as React.MutableRefObject<unknown>}
          viewMode={viewMode}
        />
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={toggleViewMode}
            aria-label={
              isIso ? "Switch to perspective view" : "Switch to isometric view"
            }
            aria-pressed={isIso}
            title={isIso ? "Perspective" : "Isometric"}
            className="pointer-events-auto bg-surface-2/80 backdrop-blur-sm"
          >
            {isIso ? <IconRotate360 /> : <IconCube />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(0.83)}
            aria-label="Zoom in"
            className="pointer-events-auto bg-surface-2/80 backdrop-blur-sm"
          >
            <IconPlus />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => zoomBy(1.2)}
            aria-label="Zoom out"
            className="pointer-events-auto bg-surface-2/80 backdrop-blur-sm"
          >
            <IconMinus />
          </Button>
        </div>
      </div>

      <aside className="flex flex-col gap-3" aria-label="Truck load summary">
        <StatGrid
          stats={[
            {
              label: "Slots",
              value: `${used}/${capacityPallets}`,
              Icon: IconCube3dSphere,
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
          onHover={setHoveredId}
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
  onHover: (id: string | null) => void;
};

function PalletList({ pallets, hoveredId, onHover }: PalletListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-md border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
          Visible pallets
        </span>
        <span className="text-[12px] tabular-nums text-ink-muted">
          {pallets.length}
        </span>
      </div>
      <ol className="flex flex-col gap-1.5 overflow-y-auto pr-1">
        {pallets.map((pallet) => {
          const active = hoveredId === pallet.pallet_id;
          const swatch = palletDisplayColor(pallet);
          return (
            <li
              key={pallet.pallet_id}
              onMouseEnter={() => onHover(pallet.pallet_id)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors cursor-pointer",
                active
                  ? "border-white/30 bg-surface-3"
                  : "border-border bg-surface-1 hover:border-white/15",
              )}
            >
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
                <div className="text-[13px] font-medium text-ink">
                  {pallet.label}
                </div>
                <div className="truncate text-[12px] text-ink-subtle">
                  {pallet.products_summary.join(" · ")}
                </div>
              </div>
            </li>
          );
        })}
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
