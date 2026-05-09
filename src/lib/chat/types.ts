import type { SuggestedRoute } from "@/components/routes/suggested-routes-mock";

export type SurfaceKey =
  | "centers_list"
  | "center_routes_table"
  | "route_overview"
  | "catalog_table"
  | "add_route_review";

export type CatalogKind = "clients" | "drivers" | "trucks";

export type ChatSelected =
  | { kind: "route"; routeId: number }
  | { kind: "suggested_route"; transportId: string }
  | null;

export type SiblingSuggestionSummary = Pick<
  SuggestedRoute,
  "transport_id" | "route_code" | "total_stops"
>;

export type PlannerChatContext = {
  surface: SurfaceKey;
  centerId: number | null;
  catalog?: CatalogKind;
  selected: ChatSelected;
  // add_route_review only — non-deterministic client state, sent in body
  // because the server can't rebuild it from IDs alone.
  suggestion?: SuggestedRoute;
  siblingSuggestions?: SiblingSuggestionSummary[];
};
