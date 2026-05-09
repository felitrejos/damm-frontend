import "server-only";

import { getDataSource } from "@/lib/chat/data-source";
import type { PlannerChatContext } from "@/lib/chat/types";
import { contextLabelFor } from "@/lib/chat/context";

const maxRows = 40;
const maxTextChars = 1_200;

export type VisibleChatContext = {
  label: string;
  prompt: string;
};

function clip(value: string | null | undefined, maxChars = maxTextChars): string | null {
  if (!value) return null;
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}...[truncated]`;
}

async function visibleDataFor(ctx: PlannerChatContext): Promise<{
  surface: string;
  data: unknown;
} | null> {
  const ds = getDataSource();

  switch (ctx.surface) {
    case "centers_list": {
      const centers = await ds.listCenters();
      return {
        surface: "centers_list",
        data: centers.slice(0, maxRows).map((c) => ({
          id: c.id,
          center: c.center,
          location: c.location,
          routes: c.routes,
          admin: c.admin,
          lat: c.lat ?? null,
          lng: c.lng ?? null,
        })),
      };
    }

    case "center_routes_table": {
      if (ctx.centerId == null) return null;
      const [center, routes] = await Promise.all([
        ds.getCenter(ctx.centerId),
        ds.listRoutesForCenter(ctx.centerId),
      ]);
      if (!center) return null;
      return {
        surface: "center_routes_table",
        data: {
          center: {
            id: center.id,
            center: center.center,
            location: center.location,
            admin: center.admin,
            lat: center.lat ?? null,
            lng: center.lng ?? null,
          },
          routeCount: routes.length,
          routes: routes.slice(0, maxRows).map((r) => ({
            id: r.id,
            code: r.code,
            driver_name: r.driver_name,
            truck_code: r.truck_code,
            stops: r.stops,
            date: r.date,
          })),
        },
      };
    }

    case "route_overview": {
      if (ctx.selected?.kind !== "route") return null;
      const route = await ds.getRoute(ctx.selected.routeId);
      if (!route) return null;
      const [truck, stops, depot, center] = await Promise.all([
        ds.getTruckByCode(route.truck_code),
        ds.getStopsForRoute(route),
        ds.getDepotForCenter(route.centerId),
        ds.getCenter(route.centerId),
      ]);
      return {
        surface: "route_overview",
        data: {
          route: {
            id: route.id,
            code: route.code,
            driver_name: route.driver_name,
            truck_code: route.truck_code,
            stops: route.stops,
            date: route.date,
            centerId: route.centerId,
          },
          center: center
            ? { id: center.id, name: center.center, location: center.location }
            : null,
          depot,
          truck: truck
            ? {
                id: truck.id,
                code: truck.code,
                plate: truck.plate ?? null,
                truck_type: truck.truck_type,
                capacity_pallets: truck.capacity_pallets,
                active: truck.active,
              }
            : null,
          ordered_stops: stops.slice(0, maxRows).map((s) => ({
            stop_id: s.stop_id,
            sequence: s.sequence,
            customer_id: s.customer_id,
            customer_name: clip(s.customer_name),
            address: clip(s.address),
            city: s.city,
            lat: s.lat,
            lng: s.lng,
            time_window: s.time_window,
            estimated_arrival: s.estimated_arrival,
            service_time_min: s.service_time_min,
          })),
          stop_count: stops.length,
          truncated: stops.length > maxRows,
        },
      };
    }

    case "catalog_table": {
      if (!ctx.catalog) return null;
      if (ctx.catalog === "clients") {
        const customers = await ds.listCustomers();
        return {
          surface: "catalog_table:clients",
          data: {
            row_count: customers.length,
            rows: customers.slice(0, maxRows).map((c) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              city: c.city ?? null,
              postal_code: c.postal_code ?? null,
              address: c.address ?? null,
              payment_condition: c.payment_condition ?? null,
              lat: c.lat ?? null,
              lng: c.lng ?? null,
            })),
            truncated: customers.length > maxRows,
          },
        };
      }
      if (ctx.catalog === "drivers") {
        const drivers = await ds.listDrivers();
        return {
          surface: "catalog_table:drivers",
          data: {
            row_count: drivers.length,
            rows: drivers.slice(0, maxRows).map((d) => ({
              id: d.id,
              code: d.code,
              name: d.name,
            })),
            truncated: drivers.length > maxRows,
          },
        };
      }
      const trucks = await ds.listTrucks();
      return {
        surface: "catalog_table:trucks",
        data: {
          row_count: trucks.length,
          rows: trucks.slice(0, maxRows).map((t) => ({
            id: t.id,
            code: t.code,
            plate: t.plate ?? null,
            truck_type: t.truck_type,
            capacity_pallets: t.capacity_pallets,
            active: t.active,
          })),
          truncated: trucks.length > maxRows,
        },
      };
    }

    case "add_route_review": {
      if (!ctx.suggestion) return null;
      const s = ctx.suggestion;
      return {
        surface: "add_route_review",
        data: {
          active_suggestion: {
            transport_id: s.transport_id,
            route_code: s.route_code,
            driver_name: s.driver_name,
            truck_code: s.truck_code,
            truck_type: s.truck_type,
            date: s.date,
            total_stops: s.total_stops,
            ordered_stops: s.ordered_stops.slice(0, maxRows).map((stop) => ({
              stop_id: stop.stop_id,
              sequence: stop.sequence,
              customer_id: stop.customer_id,
              customer_name: clip(stop.customer_name),
              city: stop.city,
              zone: stop.zone,
              lat: stop.lat,
              lng: stop.lng,
            })),
            truncated: s.ordered_stops.length > maxRows,
          },
          siblings: ctx.siblingSuggestions ?? [],
        },
      };
    }
  }
}

export async function buildVisibleChatContext(
  ctx: PlannerChatContext | undefined,
): Promise<VisibleChatContext | null> {
  if (!ctx) return null;
  const visible = await visibleDataFor(ctx);
  if (!visible) {
    return {
      label: contextLabelFor(ctx),
      prompt: [
        "This is deterministic visible workspace context supplied by the app.",
        "The user is on this surface but no data could be resolved (likely missing IDs or a not-yet-implemented backend endpoint).",
        `Surface: ${ctx.surface}`,
      ].join("\n"),
    };
  }
  return {
    label: contextLabelFor(ctx),
    prompt: [
      "This is deterministic visible workspace context supplied by the app.",
      "Use it as the only data for this answer.",
      "If a value is null, missing, or truncated, say so instead of guessing.",
      JSON.stringify(visible),
    ].join("\n"),
  };
}
