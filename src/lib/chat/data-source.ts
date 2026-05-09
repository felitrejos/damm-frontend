import "server-only";

import type { Center } from "@/components/centers/columns";
import { sampleCenters } from "@/components/centers/sample-data";
import type { Route } from "@/components/routes/columns";
import { sampleRoutes } from "@/components/routes/sample-data";
import { buildStopsForRoute, getCenterDepot } from "@/components/routes/route-stops";
import type { RouteStop } from "@/components/routes/types";
import {
  listCustomers as listCustomersFromApi,
  listDrivers as listDriversFromApi,
  listTrucks as listTrucksFromApi,
  type Customer,
  type Driver,
  type Truck,
} from "@/lib/api/catalog";

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
  getCenter(id: number): Promise<Center | null>;
  listRoutesForCenter(centerId: number): Promise<Route[]>;
  getRoute(routeId: number): Promise<Route | null>;
  listCustomers(): Promise<Customer[]>;
  listDrivers(): Promise<Driver[]>;
  listTrucks(): Promise<Truck[]>;
  getTruckByCode(code: string): Promise<Truck | null>;
  getStopsForRoute(route: Route): Promise<RouteStop[]>;
  getDepotForCenter(centerId: number): Promise<Depot | null>;
}

const mockBackedDataSource: PlannerDataSource = {
  async listCenters() {
    return sampleCenters;
  },
  async getCenter(id) {
    return sampleCenters.find((c) => c.id === id) ?? null;
  },
  async listRoutesForCenter(centerId) {
    return sampleRoutes.filter((r) => r.centerId === centerId);
  },
  async getRoute(routeId) {
    return sampleRoutes.find((r) => r.id === routeId) ?? null;
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
  async getTruckByCode(code) {
    const trucks = await safeList(listTrucksFromApi, "getTruckByCode");
    return trucks.find((t) => t.code === code) ?? null;
  },
  async getStopsForRoute(route) {
    return buildStopsForRoute(route);
  },
  async getDepotForCenter(centerId) {
    return getCenterDepot(centerId);
  },
};

export function getDataSource(): PlannerDataSource {
  return mockBackedDataSource;
}
