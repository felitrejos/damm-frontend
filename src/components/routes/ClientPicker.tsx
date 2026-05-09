"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import { IconChevronDown, IconFilter } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from "@/components/ui/map";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { Client } from "@/components/clients/columns";

const BCN_CENTER: [number, number] = [2.1734, 41.3851];
const BCN_ZOOM = 12;

const ZONE_COLORS: Record<string, string> = {
  Eixample: "#f59e0b",
  Gràcia: "#8b5cf6",
  "Sants-Montjuïc": "#10b981",
  "Sant Martí": "#ef4444",
  "Ciutat Vella": "#3b82f6",
};
const FALLBACK_COLOR = "#64748b";
const colorForZone = (z: string) => ZONE_COLORS[z] ?? FALLBACK_COLOR;

type MappedClient = Client & { lat: number; lng: number };
const isMappable = (c: Client): c is MappedClient =>
  c.lat != null && c.lng != null;

type Props = {
  clients: Client[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
};

export function ClientPicker({ clients, selectedIds, onChange }: Props) {
  const [search, setSearch] = React.useState("");
  const [zoneFilter, setZoneFilter] = React.useState<string[]>([]);

  const zones = React.useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => set.add(c.zone));
    return Array.from(set).sort();
  }, [clients]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (zoneFilter.length > 0 && !zoneFilter.includes(c.zone)) return false;
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.code.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [clients, search, zoneFilter]);

  const mappable = React.useMemo(() => filtered.filter(isMappable), [filtered]);

  // Selected always sticks to the top regardless of search/zone filters,
  // so the user can always see + un-pick what they've added. Below the
  // selected block we show the filtered remainder.
  const selectedSet = React.useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );
  const sortedRows = React.useMemo(() => {
    const selectedRows = clients.filter((c) => selectedSet.has(c.id));
    const otherRows = filtered.filter((c) => !selectedSet.has(c.id));
    return { selectedRows, otherRows };
  }, [clients, filtered, selectedSet]);

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  };

  const toggleZone = (zone: string, checked: boolean) => {
    setZoneFilter((curr) =>
      checked ? [...curr, zone] : curr.filter((z) => z !== zone),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" />}
          >
            <IconFilter />
            <span>Zone</span>
            {zoneFilter.length > 0 ? (
              <span className="rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                {zoneFilter.length}
              </span>
            ) : null}
            <IconChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {zones.map((z) => (
              <DropdownMenuCheckboxItem
                key={z}
                checked={zoneFilter.includes(z)}
                onCheckedChange={(c) => toggleZone(z, !!c)}
              >
                <span
                  className="mr-2 inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: colorForZone(z) }}
                  aria-hidden
                />
                {z}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
        <div className="order-2 h-[360px] rounded-lg border bg-card [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-y-auto">
          <Table>
            <TableBody>
              {sortedRows.selectedRows.length === 0 &&
              sortedRows.otherRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center">
                    No clients match.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {sortedRows.selectedRows.map((c) => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      checked
                      onToggle={() => toggle(c.id)}
                    />
                  ))}
                  {sortedRows.selectedRows.length > 0 &&
                  sortedRows.otherRows.length > 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="h-6 bg-muted/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        Available
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {sortedRows.otherRows.map((c) => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      checked={false}
                      onToggle={() => toggle(c.id)}
                    />
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="order-1 h-[360px] overflow-hidden rounded-lg border sm:order-2">
          <Map center={BCN_CENTER} zoom={BCN_ZOOM} className="h-full w-full">
            <MapControls />
            <ZoneShapes clients={mappable} />
            {mappable.map((c) => {
              const checked = selectedIds.includes(c.id);
              const color = colorForZone(c.zone);
              return (
                <MapMarker key={c.id} longitude={c.lng} latitude={c.lat}>
                  <MarkerContent>
                    <div
                      className={
                        checked
                          ? "size-3.5 rounded-full border-2 border-white bg-white animate-marker-pulse"
                          : "size-3.5 rounded-full border-2"
                      }
                      style={
                        checked
                          ? undefined
                          : { borderColor: color, backgroundColor: color }
                      }
                    />
                  </MarkerContent>
                  <MarkerPopup className="w-60 p-3">
                    <div className="flex flex-col gap-2">
                      <div>
                        <div className="text-sm font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.code} · {c.city}
                        </div>
                        <div
                          className="mt-1 text-xs font-medium"
                          style={{ color }}
                        >
                          {c.zone}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={checked ? "destructive" : "default"}
                        onClick={() => toggle(c.id)}
                      >
                        {checked ? "Remove from route" : "Add to route"}
                      </Button>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}
          </Map>
        </div>
      </div>
    </div>
  );
}

function ClientRow({
  client,
  checked,
  onToggle,
}: {
  client: Client;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TableRow
      data-state={checked ? "selected" : undefined}
      onClick={onToggle}
      className="cursor-pointer"
    >
      <TableCell className="px-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          aria-label={`Select ${client.name}`}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell className="px-3">
        <div className="text-[13px] font-medium leading-tight">
          {client.name}
        </div>
      </TableCell>
      <TableCell className="px-3 text-right">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colorForZone(client.zone) }}
            aria-hidden
          />
          {client.zone}
        </span>
      </TableCell>
    </TableRow>
  );
}

const SHAPE_SOURCE = "client-zone-shapes";
const SHAPE_FILL_LAYER = "client-zone-shapes-fill";
const SHAPE_LINE_LAYER = "client-zone-shapes-line";

const MIN_RADIUS_M = 180;
const PADDING_M = 140;

function ZoneShapes({ clients }: { clients: MappedClient[] }) {
  const { map, isLoaded } = useMap();

  React.useEffect(() => {
    if (!map || !isLoaded) return;

    map.addSource(SHAPE_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: SHAPE_FILL_LAYER,
      type: "fill",
      source: SHAPE_SOURCE,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.12,
      },
    });
    map.addLayer({
      id: SHAPE_LINE_LAYER,
      type: "line",
      source: SHAPE_SOURCE,
      paint: {
        "line-color": ["get", "color"],
        "line-opacity": 0.55,
        "line-width": 1.5,
      },
    });

    return () => {
      // Parent Map may already be disposed when the modal closes; guard so
      // cleanup never throws against a half-removed maplibre instance.
      try {
        if (map?.getLayer?.(SHAPE_LINE_LAYER))
          map.removeLayer(SHAPE_LINE_LAYER);
        if (map?.getLayer?.(SHAPE_FILL_LAYER))
          map.removeLayer(SHAPE_FILL_LAYER);
        if (map?.getSource?.(SHAPE_SOURCE)) map.removeSource(SHAPE_SOURCE);
      } catch {
        // no-op
      }
    };
  }, [map, isLoaded]);

  React.useEffect(() => {
    if (!map || !isLoaded) return;
    const src = map.getSource(SHAPE_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: buildZoneCircles(clients),
    });
  }, [map, isLoaded, clients]);

  return null;
}

function buildZoneCircles(clients: MappedClient[]): GeoJSON.Feature[] {
  const byZone = new globalThis.Map<string, MappedClient[]>();
  clients.forEach((c) => {
    const list = byZone.get(c.zone) ?? [];
    list.push(c);
    byZone.set(c.zone, list);
  });

  const features: GeoJSON.Feature[] = [];
  byZone.forEach((members, zone) => {
    const lng =
      members.reduce((sum, m) => sum + m.lng, 0) / members.length;
    const lat =
      members.reduce((sum, m) => sum + m.lat, 0) / members.length;
    const center: [number, number] = [lng, lat];
    const maxDist = members.reduce(
      (acc, m) => Math.max(acc, haversineMeters(center, [m.lng, m.lat])),
      0,
    );
    const radius = Math.max(MIN_RADIUS_M, maxDist + PADDING_M);
    features.push({
      type: "Feature",
      properties: { zone, color: colorForZone(zone) },
      geometry: {
        type: "Polygon",
        coordinates: [circleRing(center, radius)],
      },
    });
  });
  return features;
}

function haversineMeters(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function circleRing(
  center: [number, number],
  radiusM: number,
  vertices = 64,
): [number, number][] {
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos(latRad));
  const ring: [number, number][] = [];
  for (let i = 0; i < vertices; i++) {
    const theta = (i / vertices) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  ring.push(ring[0]);
  return ring;
}
