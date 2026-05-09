import type {
  CatalogKind,
  ChatSelected,
  PlannerChatContext,
  SiblingSuggestionSummary,
  SurfaceKey,
} from "./types";
import type { SuggestedRoute } from "@/components/routes/suggested-routes-mock";

const surfaces: readonly SurfaceKey[] = [
  "centers_list",
  "center_routes_table",
  "route_overview",
  "catalog_table",
  "add_route_review",
];

const catalogs: readonly CatalogKind[] = ["clients", "drivers", "trucks"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSelected(value: unknown): ChatSelected {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  if (kind === "route" && typeof value.routeId === "number") {
    return { kind: "route", routeId: value.routeId };
  }
  if (kind === "suggested_route" && typeof value.transportId === "string") {
    return { kind: "suggested_route", transportId: value.transportId };
  }
  return null;
}

function parseSuggestion(value: unknown): SuggestedRoute | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.transport_id !== "string" ||
    typeof value.route_code !== "string" ||
    typeof value.total_stops !== "number" ||
    !Array.isArray(value.ordered_stops)
  ) {
    return undefined;
  }
  return value as unknown as SuggestedRoute;
}

function parseSiblings(value: unknown): SiblingSuggestionSummary[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: SiblingSuggestionSummary[] = [];
  for (const item of value) {
    if (
      isRecord(item) &&
      typeof item.transport_id === "string" &&
      typeof item.route_code === "string" &&
      typeof item.total_stops === "number"
    ) {
      out.push({
        transport_id: item.transport_id,
        route_code: item.route_code,
        total_stops: item.total_stops,
      });
    }
  }
  return out;
}

export function parseChatContext(value: unknown): PlannerChatContext | undefined {
  if (!isRecord(value)) return undefined;
  const surface = surfaces.includes(value.surface as SurfaceKey)
    ? (value.surface as SurfaceKey)
    : null;
  if (!surface) return undefined;

  const centerId =
    typeof value.centerId === "number" ? value.centerId : null;
  const catalog = catalogs.includes(value.catalog as CatalogKind)
    ? (value.catalog as CatalogKind)
    : undefined;

  return {
    surface,
    centerId,
    catalog,
    selected: parseSelected(value.selected),
    suggestion: parseSuggestion(value.suggestion),
    siblingSuggestions: parseSiblings(value.siblingSuggestions),
  };
}

export function contextLabelFor(ctx: PlannerChatContext | undefined): string {
  if (!ctx) return "This page";
  switch (ctx.surface) {
    case "centers_list":
      return "All centers";
    case "center_routes_table":
      return ctx.centerId != null ? `Routes for center ${ctx.centerId}` : "Center routes";
    case "route_overview":
      if (ctx.selected?.kind === "route") {
        return `Route ${ctx.selected.routeId}`;
      }
      return "Route";
    case "catalog_table": {
      const map: Record<CatalogKind, string> = {
        clients: "Clients catalog",
        drivers: "Drivers catalog",
        trucks: "Trucks catalog",
      };
      return ctx.catalog ? map[ctx.catalog] : "Catalog";
    }
    case "add_route_review":
      return ctx.suggestion
        ? `Suggestion ${ctx.suggestion.route_code}`
        : "Suggested routes";
  }
}
