import "server-only";

import type { Center } from "@/components/centers/columns";
import type { Route } from "@/components/routes/columns";
import { transportStopsToRouteStops, depotForCenter } from "@/components/routes/route-stops";
import type { RouteStop } from "@/components/routes/types";
import {
  listCustomers as listCustomersFromApi,
  listDrivers as listDriversFromApi,
  listTrucks as listTrucksFromApi,
  type Customer,
  type Driver,
  type Truck,
} from "@/lib/api/catalog";
import { fetchJson } from "@/lib/api/client";
import {
  getTransport,
  listTransports,
} from "@/lib/api/transports";
import { listWarehouses, getWarehouse } from "@/lib/api/warehouses";
import { z } from "zod";

const RawTransport = z.object({
  id: z.string(),
  truck_id: z.string().nullable().optional(),
});

async function safeList<T>(
  loader: () => Promise<T[]>,
  label: string,
): Promise<T[]> {
  try {
    return await loader();
  } catch (err) {
    console.warn(`[chat/data-source] ${label} unavailable:`, err);
    return [];
  }
}

export type Depot = { lat: number; lng: number };

export interface PlannerDataSource {
  listCenters(): Promise<Center[]>;
  getCenter(id: string): Promise<Center | null>;
  listRoutesForCenter(centerId: string): Promise<Route[]>;
  getRoute(routeId: string): Promise<Route | null>;
  listCustomers(): Promise<Customer[]>;
  listDrivers(): Promise<Driver[]>;
  listTrucks(): Promise<Truck[]>;
  getTruckById(id: string): Promise<Truck | null>;
  getStopsForRoute(route: Route): Promise<RouteStop[]>;
  getDepotForCenter(centerId: string): Promise<Depot | null>;
}

async function transportsForWarehouse(centerId: string): Promise<Route[]> {
  try {
    const [summaries, trucks, raw] = await Promise.all([
      listTransports(),
      listTrucksFromApi(),
      fetchJson("/api/v1/db/transports?limit=10000", z.array(RawTransport)),
    ]);
    const truckIds = new Set(
      trucks.filter((t) => t.warehouse_id === centerId).map((t) => t.id),
    );
    const transportIds = new Set(
      raw
        .filter((t) => t.truck_id != null && truckIds.has(t.truck_id))
        .map((t) => t.id),
    );
    return summaries.filter((s) => transportIds.has(s.transport_id));
  } catch {
    return [];
  }
}

const liveDataSource: PlannerDataSource = {
  async listCenters() {
    return safeList(listWarehouses, "listCenters");
  },
  async getCenter(id) {
    return getWarehouse(id);
  },
  async listRoutesForCenter(centerId) {
    return transportsForWarehouse(centerId);
  },
  async getRoute(routeId) {
    const detail = await getTransport(routeId);
    if (!detail) return null;
    return {
      transport_id: detail.transport_id,
      route_code: detail.route_code,
      driver_name: detail.driver_name ?? null,
      date: detail.date,
      stop_count: detail.stops.length,
      truck_type: detail.truck_type ?? null,
    };
  },
  listCustomers() {
    return safeList(listCustomersFromApi, "listCustomers");
  },
  listDrivers() {
    return safeList(listDriversFromApi, "listDrivers");
  },
  listTrucks() {
    return safeList(listTrucksFromApi, "listTrucks");
  },
  async getTruckById(id) {
    const trucks = await safeList(listTrucksFromApi, "getTruckById");
    return trucks.find((t) => t.id === id) ?? null;
  },
  async getStopsForRoute(route) {
    const detail = await getTransport(route.transport_id);
    if (!detail) return [];
    return transportStopsToRouteStops(detail.stops);
  },
  async getDepotForCenter(centerId) {
    const center = await getWarehouse(centerId);
    return depotForCenter(center);
  },
};

export function getDataSource(): PlannerDataSource {
  return liveDataSource;
}
