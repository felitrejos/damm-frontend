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
import {
  getTransport,
  listTransports,
} from "@/lib/api/transports";
import { listWarehouses, getWarehouse } from "@/lib/api/warehouses";

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

const liveDataSource: PlannerDataSource = {
  async listCenters() {
    return safeList(listWarehouses, "listCenters");
  },
  async getCenter(id) {
    return getWarehouse(id);
  },
  // Returns all transports — no per-warehouse filter. The seeded dataset has
  // transports with route/driver but no truck_id, so a truck->warehouse join
  // hides everything useful. Demo runs single-warehouse so this is honest.
  async listRoutesForCenter(_centerId) {
    return safeList(listTransports, "listTransports");
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
