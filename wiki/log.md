# SmartTruck Wiki Log

## [2026-05-09] frontend | Route Hero Section (truck + map tabs, temporary)

Added a route hero section that opens when a route is selected. The hero
contains two tabs: **Camión** (3D wireframe of the loaded truck) and **Mapa**
(placeholder for the teammate working on map rendering).

Surface and routing:

- Routes are nested under each logistics centre rather than living as a
  top-level sidebar destination. Flow: `Centers → click center →
  CenterRoutesView (filtered by center_id) → click route → RouteHero`.
- Breadcrumb chains as `Centers › <Center> › <Route>` with each crumb
  resetting deeper selection.
- A dev-only direct entry `GET /preview/route/[id]` was added so the
  hero can be inspected without depending on the centre→route click.

Truck tab:

- 3D scene ported from the `codex/wip-truck-wireframe-spike` Vite spike into
  `src/components/routes/TruckWireframeScene.tsx`. Loaded via
  `next/dynamic({ ssr: false })` because R3F needs a real WebGL context.
- Renders cargo box, cargo floor grid, rear door, forward arrow, cabin
  (with grille / bumper / mirrors / headlights), chassis-lifted body,
  3-axle wheel set with steel-hub wheels, wheel arches, and side ribs.
- `drei <Text>` was intentionally removed from the scene — its
  `troika-three-text` SDF font generation pushed the WebGL context past
  its limit on some machines and lost it. Pallet labels live in the
  sidebar instead.

Map tab:

- Placeholder card with copy explaining the upcoming mapcn + MapLibre
  rendering against `RouteResult.ordered_stops` and `route_geojson`.
- Owned by another teammate; intentionally not implemented in this branch.

Contract status:

- No contract change. The truck visualization conforms to the existing
  `TruckVisualization` / `VizPallet` shape from
  `wiki/contracts/data-models.md`.
- New mock data lives in `src/components/routes/sample-data.ts` and
  validates against the contract.

Temporary scope flagged for follow-up:

- `/preview/route/[id]` should be removed once routes have real URLs.
- The `CenterRoutesView` orchestration inside `CentersListPage` is a
  scaffold to unblock the truck tab; the centres team may rewire the
  navigation later (e.g. real Next.js routing with `[centerId]/[routeId]`).
- The hero layout (KPI strip, side panel ratios) will evolve once real
  `RouteResult` payloads stream via the optimization WebSocket.

## [2026-05-09] frontend | Real Backend Directory Pages

Connected the frontend directory pages to the real backend data source.

- `/clients` now server-renders customers from `GET /api/v1/db/customers?limit=10000`.
- `/drivers` now server-renders drivers from `GET /api/v1/db/drivers?limit=10000`.
- `/trucks` now server-renders trucks from `GET /api/v1/db/trucks?limit=10000`.
- Shared table behavior was tightened for async data, fixed row height,
  compact filter dropdowns, and per-entity column sizing.
- App header branding changed to `Damm SmartRoutes`.

No shared contract change was required because the implementation uses existing
backend database endpoints and validates payloads locally with Zod.

Follow-up: directory pages now catch backend/API/schema failures during
server-side data loading and render an in-page error state instead of returning
a Next.js 500 response.

## [2026-05-09] CONTRACT_CHANGE_PROPOSAL | Add Center model + endpoint

Frontend introduced a centers picker on `/` (data table of distribution
centers, sortable, filterable). Added a `Center` Pydantic model and a
`GET /api/v1/data/centers` endpoint to support it.

- Fields: `id: int`, `center: str` (display name), `location: str` (zone),
  `routes: int`, `admin: str`.
- No existing fields renamed or removed.
- Frontend ships with placeholder data in `src/components/centers/sample-data.ts`
  until the backend implements `/api/v1/data/centers`.

See `wiki/decisions/2026-05-09-centers-model.md`.

## [2026-05-09] frontend | Planner Pages And UX Flow

Updated the frontend wiki with the planned Next.js stack, core page map, planner workspace layout, optimization flow, custom truck visualization rules, stop inspection details, and export surfaces.

## [2026-05-09] setup | Shared LLM Wiki Snapshot

Created the shared SmartTruck wiki from the definitive plan, Karpathy LLM-wiki workflow, and `DATA_MODELS.md`.

Key decisions:

- Use shared markdown contracts because frontend and backend repos will be developed separately.
- Treat data models, API paths, enum values, and WebSocket messages as the most important coordination contract.
- Use `/api/v1/optimize/full` plus `/ws/jobs/{job_id}` as the primary optimization workflow.
- Keep backend deterministic; use OpenAI Agents SDK only for explanations and generated operational summaries.
