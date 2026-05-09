"use client";

import { useMemo } from "react";
import { IconArrowLeft, IconMap2, IconTruck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { sampleTrucks } from "@/components/trucks/sample-data";

import type { Route } from "./columns";
import { RouteMapTab } from "./RouteMapTab";
import { RouteTruckTab } from "./RouteTruckTab";
import { buildTruckVisualization } from "./sample-data";

type RouteHeroProps = {
  route: Route;
  onBack: () => void;
};

export function RouteHero({ route, onBack }: RouteHeroProps) {
  const truck = useMemo(
    () => sampleTrucks.find((t) => t.code === route.truck_code) ?? null,
    [route.truck_code],
  );
  const truckType = (truck?.truck_type ?? "8pal") as "van" | "6pal" | "8pal";
  const capacity = truck?.capacity_pallets ?? (truckType === "van" ? 3 : truckType === "6pal" ? 6 : 8);
  const visualization = useMemo(
    () => buildTruckVisualization(truckType),
    [truckType],
  );

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
            {route.code}
          </h2>
          <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-ink-subtle">
            {truckType}
          </span>
        </div>

        <KpiStrip route={route} truckCode={route.truck_code} />
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
            visualization={visualization}
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

function KpiStrip({ route, truckCode }: { route: Route; truckCode: string }) {
  const kpis = [
    { label: "Driver", value: route.driver_name },
    { label: "Truck", value: truckCode },
    { label: "Stops", value: String(route.stops) },
    { label: "Date", value: route.date },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
