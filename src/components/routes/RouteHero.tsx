"use client";

import { useMemo } from "react";
import { IconMap2, IconTruck } from "@tabler/icons-react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { sampleTrucks } from "@/components/trucks/sample-data";

import type { Route } from "./columns";
import { RouteMapTab } from "./RouteMapTab";
import { RouteTruckTab } from "./RouteTruckTab";
import { buildStopsForRoute, getCenterDepot } from "./route-stops";
import { buildTruckVisualization } from "./sample-data";

type RouteHeroProps = {
  route: Route;
};

export function RouteHero({ route }: RouteHeroProps) {
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
  const stops = useMemo(() => buildStopsForRoute(route), [route]);
  const depot = useMemo(() => getCenterDepot(route.centerId), [route.centerId]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h2 id="route-hero-title" className="headline text-ink truncate">
          {route.code}
        </h2>
        <KpiInline route={route} />
      </header>

      <Tabs
        defaultValue="truck"
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <TabsList aria-label="Route detail view" className="self-start">
          <TabsTab value="truck">
            <IconTruck aria-hidden />
            Truck
          </TabsTab>
          <TabsTab value="map">
            <IconMap2 aria-hidden />
            Map
          </TabsTab>
        </TabsList>

        <TabsPanel value="truck" className="flex min-h-0 flex-1 flex-col">
          <RouteTruckTab
            visualization={visualization}
            capacityPallets={capacity}
          />
        </TabsPanel>

        <TabsPanel value="map" className="flex min-h-0 flex-1 flex-col">
          <RouteMapTab route={route} stops={stops} depot={depot} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}

function KpiInline({ route }: { route: Route }) {
  const kpis = [
    { label: "Driver", value: route.driver_name },
    { label: "Truck", value: route.truck_code },
    { label: "Stops", value: String(route.stops) },
    { label: "Date", value: route.date },
  ];

  return (
    <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      {kpis.map(({ label, value }, idx) => (
        <div
          key={label}
          className="flex items-baseline gap-1.5"
        >
          {idx > 0 && (
            <span aria-hidden className="text-ink-tertiary">·</span>
          )}
          <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
            {label}
          </dt>
          <dd className="text-[12px] font-medium tabular-nums text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
