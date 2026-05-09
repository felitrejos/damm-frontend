"use client";

import { IconArrowLeft, IconMap2, IconTruck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

import type { Route } from "./columns";
import { RouteMapTab } from "./RouteMapTab";
import { RouteTruckTab } from "./RouteTruckTab";
import { sampleTruckVisualization } from "./sample-data";

type RouteHeroProps = {
  route: Route;
  onBack: () => void;
};

const TRUCK_CAPACITY: Record<Route["truck_type"], number> = {
  "6pal": 6,
  "8pal": 8,
  van: 4,
};

export function RouteHero({ route, onBack }: RouteHeroProps) {
  const capacity = TRUCK_CAPACITY[route.truck_type];

  return (
    <section
      aria-labelledby="route-hero-title"
      className="flex flex-col gap-5"
    >
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <IconArrowLeft />
            Routes
          </Button>
          <span className="text-ink-tertiary" aria-hidden>
            ›
          </span>
          <h2
            id="route-hero-title"
            className="headline text-ink truncate"
          >
            {route.route_code}
          </h2>
          <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-ink-subtle">
            {route.truck_type}
          </span>
        </div>

        <KpiStrip route={route} />
      </header>

      <Tabs defaultValue="truck" className="gap-4">
        <TabsList aria-label="Route detail view">
          <TabsTab value="truck">
            <IconTruck aria-hidden />
            Camión
          </TabsTab>
          <TabsTab value="map">
            <IconMap2 aria-hidden />
            Mapa
          </TabsTab>
        </TabsList>

        <TabsPanel value="truck">
          <RouteTruckTab
            visualization={sampleTruckVisualization}
            capacityPallets={capacity}
          />
        </TabsPanel>

        <TabsPanel value="map">
          <RouteMapTab route={route} />
        </TabsPanel>
      </Tabs>
    </section>
  );
}

function KpiStrip({ route }: { route: Route }) {
  const hours = Math.floor(route.duration_min / 60);
  const minutes = Math.round(route.duration_min % 60);
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const kpis = [
    { label: "Driver", value: route.driver_name },
    { label: "Stops", value: String(route.stops) },
    { label: "Distance", value: `${route.distance_km.toFixed(1)} km` },
    { label: "Duration", value: duration },
    { label: "Date", value: route.date },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-md border border-border bg-surface-2 px-3 py-2"
        >
          <dt className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">
            {label}
          </dt>
          <dd className="text-[13px] font-medium tabular-nums text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
