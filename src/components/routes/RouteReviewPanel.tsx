"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";

import {
  Map,
  MapControls,
  MapMarker,
  MapPopup,
  MarkerContent,
  useMap,
} from "@/components/ui/map";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SuggestedRoute, SuggestedStop } from "./suggested-routes-mock";

const BCN_CENTER: [number, number] = [2.1734, 41.3851];
const BCN_ZOOM = 12;

// Friendly mock zones get hand-picked colors. Anything else (e.g. backend
// zone_codes like "DD13100050") gets a deterministic color from a hash so
// each cluster still reads as visually distinct.
const ZONE_COLORS: Record<string, string> = {
  Eixample: "#f59e0b",
  Gràcia: "#8b5cf6",
  "Sants-Montjuïc": "#10b981",
  "Sant Martí": "#ef4444",
  "Ciutat Vella": "#3b82f6",
};
const HASH_PALETTE = [
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];
const FALLBACK_COLOR = "#64748b";

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

const colorForZone = (z: string) => {
  if (!z || z === "—") return FALLBACK_COLOR;
  return ZONE_COLORS[z] ?? HASH_PALETTE[hashIndex(z, HASH_PALETTE.length)]!;
};

type MappedStop = SuggestedStop & { lat: number; lng: number };
const isMappable = (s: SuggestedStop): s is MappedStop =>
  s.lat != null && s.lng != null;

type Props = {
  route: SuggestedRoute;
};

export function RouteReviewPanel({ route }: Props) {
  const [activeStopId, setActiveStopId] = React.useState<string | null>(null);

  // Reset hover state whenever the active suggestion changes — otherwise a
  // stop_id from the previous route can resolve to nothing here.
  React.useEffect(() => {
    setActiveStopId(null);
  }, [route.transport_id]);

  const stops = route.ordered_stops;
  const mappable = React.useMemo(() => stops.filter(isMappable), [stops]);
  const activeStop = React.useMemo(
    () => mappable.find((s) => s.stop_id === activeStopId) ?? null,
    [mappable, activeStopId],
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
      <div className="order-2 h-full min-h-[320px] overflow-hidden rounded-lg border sm:order-1">
        <Map center={BCN_CENTER} zoom={BCN_ZOOM} className="h-full w-full">
          <MapControls />
          <ZoneShapes stops={mappable} />
          <FitBoundsToStops stops={mappable} initialDelayMs={450} />
          {mappable.map((s) => {
            const color = colorForZone(s.zone);
            const isActive = s.stop_id === activeStopId;
            return (
              <MapMarker
                key={s.stop_id}
                longitude={s.lng}
                latitude={s.lat}
                onClick={() => setActiveStopId(s.stop_id)}
              >
                <MarkerContent>
                  <div
                    className={
                      isActive
                        ? "size-3.5 rounded-full border-2 border-white animate-marker-pulse"
                        : "size-3.5 rounded-full border-2"
                    }
                    style={{ borderColor: color, backgroundColor: color }}
                  />
                </MarkerContent>
              </MapMarker>
            );
          })}
          {activeStop ? (
            <MapPopup
              longitude={activeStop.lng}
              latitude={activeStop.lat}
              className="w-60 p-3"
            >
              <div className="text-sm font-semibold">
                {activeStop.customer_name}
              </div>
              <div className="text-xs text-muted-foreground">
                Stop {activeStop.sequence}
              </div>
              <div
                className="mt-1 text-xs font-medium"
                style={{ color: colorForZone(activeStop.zone) }}
              >
                {activeStop.zone}
              </div>
            </MapPopup>
          ) : null}
        </Map>
      </div>

      <div className="order-1 h-full min-h-[320px] overflow-hidden rounded-lg border bg-card sm:order-2 [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-y-auto [&>[data-slot=table-container]]:[scrollbar-width:none] [&>[data-slot=table-container]::-webkit-scrollbar]:hidden">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-10 px-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                #
              </TableHead>
              <TableHead className="px-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                Client
              </TableHead>
              <TableHead className="px-3 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                Zone
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-20 text-center">
                  No stops in this route.
                </TableCell>
              </TableRow>
            ) : (
              stops.map((s) => (
                <TableRow
                  key={s.stop_id}
                  data-state={
                    s.stop_id === activeStopId ? "selected" : undefined
                  }
                  onMouseEnter={() => setActiveStopId(s.stop_id)}
                  onMouseLeave={() =>
                    setActiveStopId((curr) =>
                      curr === s.stop_id ? null : curr,
                    )
                  }
                  className="cursor-default"
                >
                  <TableCell className="px-3 text-[12px] tabular-nums text-muted-foreground">
                    {s.sequence}
                  </TableCell>
                  <TableCell className="px-3">
                    <div className="text-[13px] font-medium leading-tight">
                      {s.customer_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.zone}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 text-right">
                    <span
                      className="ml-auto inline-block size-2 rounded-full"
                      style={{ backgroundColor: colorForZone(s.zone) }}
                      aria-hidden
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const SHAPE_SOURCE = "suggested-route-zone-shapes";
const SHAPE_FILL_LAYER = "suggested-route-zone-shapes-fill";
const SHAPE_LINE_LAYER = "suggested-route-zone-shapes-line";

const MIN_RADIUS_M = 180;
const PADDING_M = 140;

// Fits the map viewport to the active route's zone circles (not the raw
// markers) so switching suggestions brings the whole zone footprint into
// view — including the padded ring around the outermost stop.
//
// `initialDelayMs` defers the *first* fit so it fires after the dialog's
// width/height resize finishes — fitting in parallel with the resize looks
// like the map is fighting the modal. Subsequent fits (route switches) run
// immediately.
function FitBoundsToStops({
  stops,
  initialDelayMs = 0,
}: {
  stops: MappedStop[];
  initialDelayMs?: number;
}) {
  const { map, isLoaded } = useMap();
  const [ready, setReady] = React.useState(initialDelayMs === 0);

  React.useEffect(() => {
    if (initialDelayMs === 0) return;
    const timer = window.setTimeout(() => setReady(true), initialDelayMs);
    return () => window.clearTimeout(timer);
  }, [initialDelayMs]);

  React.useEffect(() => {
    if (!map || !isLoaded || !ready || stops.length === 0) return;

    const zoneCircles = computeZoneCircles(stops);
    if (zoneCircles.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    zoneCircles.forEach(({ center: [lng, lat], radiusM }) => {
      const latRad = (lat * Math.PI) / 180;
      const dLat = radiusM / 111320;
      const dLng = radiusM / (111320 * Math.cos(latRad));
      bounds.extend([lng - dLng, lat - dLat]);
      bounds.extend([lng + dLng, lat + dLat]);
    });

    if (zoneCircles.length === 1) {
      map.flyTo({
        center: zoneCircles[0].center,
        zoom: 13.5,
        duration: 700,
      });
      return;
    }

    map.fitBounds(bounds, {
      padding: 60,
      duration: 700,
      maxZoom: 14,
    });
  }, [map, isLoaded, ready, stops]);

  return null;
}

type ZoneCircle = { center: [number, number]; radiusM: number };

function computeZoneCircles(stops: MappedStop[]): ZoneCircle[] {
  const byZone = new globalThis.Map<string, MappedStop[]>();
  stops.forEach((s) => {
    const list = byZone.get(s.zone) ?? [];
    list.push(s);
    byZone.set(s.zone, list);
  });
  const circles: ZoneCircle[] = [];
  byZone.forEach((members) => {
    const lng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;
    const lat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
    const center: [number, number] = [lng, lat];
    const maxDist = members.reduce(
      (acc, m) => Math.max(acc, haversineMeters(center, [m.lng, m.lat])),
      0,
    );
    circles.push({ center, radiusM: Math.max(MIN_RADIUS_M, maxDist + PADDING_M) });
  });
  return circles;
}

function ZoneShapes({ stops }: { stops: MappedStop[] }) {
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
      features: buildZoneCircles(stops),
    });
  }, [map, isLoaded, stops]);

  return null;
}

function buildZoneCircles(stops: MappedStop[]): GeoJSON.Feature[] {
  const byZone = new globalThis.Map<string, MappedStop[]>();
  stops.forEach((s) => {
    const list = byZone.get(s.zone) ?? [];
    list.push(s);
    byZone.set(s.zone, list);
  });

  const features: GeoJSON.Feature[] = [];
  byZone.forEach((members, zone) => {
    const lng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;
    const lat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
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

function haversineMeters(a: [number, number], b: [number, number]): number {
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
