# SmartTruck Wiki Log

## [2026-05-10] frontend | Context-aware planner assistant

Added a read-only "Why?" assistant pinned bottom-right of the app shell.
The bubble morphs in place into a 420×540 panel — same DOM node,
transitioning width/height/border-radius — exactly the autOScan-agent
pattern. Hidden on `/login` (the auth route group does not mount
`AppShell`).

Architecture:

- Each page calls `useChatSurface(ctx)` to publish a
  `PlannerChatContext` onto a shared React context. The bubble reads it
  and ships it on every `sendMessage` body.
- `POST /api/chat` parses the context, calls
  `buildVisibleChatContext()`, injects the JSON snapshot into the
  Gemini system prompt, and streams the response back via `streamText`
  (`@ai-sdk/google`, `gemini-2.5-flash`, `temperature: 0.3`, no tools).
- All canonical reads go through `src/lib/chat/data-source.ts` — the
  single shim mapping mock + backend sources behind a stable
  `PlannerDataSource` interface. When `/api/v1/data/centers` (proposed
  in `wiki/decisions/2026-05-09-centers-model.md`) or a future routes
  endpoint ships, only this file changes.

Surfaces wired (one snapshot shape each, clipped to 40 rows):

- `centers_list` — `/`.
- `center_routes_table` — `/centers/[id]` with no route selected.
- `route_overview` — `/centers/[id]` with a route selected, plus
  `/preview/route/[id]`.
- `catalog_table` — `/clients`, `/drivers`, `/trucks` (server fetches
  the same `/api/v1/db/*` endpoints the page already hits, with a
  graceful fallback to `[]` when the backend is down).
- `add_route_review` — the active suggestion + sibling summaries are
  sent in the request body because `generateSuggestedRoutes(date)` is
  non-deterministic client state.

Agent voice: dispatcher, calm and direct. Refuses optimization, KPI
comparison, pick lists, and exports as out of scope per
`wiki/frontend/agent-instructions.md` § Frontend Mission. Refuses any
action mutation (add, edit, send) because the chat is read-only and
the UI owns those controls.

Stack note: the autOScan reference repo wraps Groq Llama via
`@openai/agents` + `@openai/agents-extensions`. Those packages require
zod 4, but every wiki schema (`domain.ts`, `catalog.ts`, every
`columns.tsx`) is zod 3. Upgrading would be a contract-touching change
for no real benefit — we don't use tools, conversation IDs, or any
agent-runtime feature — so the route handler uses `streamText` from
the AI SDK directly. Behavior parity with autOScan; less code.

Verified end-to-end against the running dev server:

- Centers list: *"How many centers are there?"* → answers `12`,
  grounded in `sampleCenters`.
- Route overview (R-08-A): *"Time window for the second stop?"* →
  reads from `buildStopsForRoute` synthetic stops, returns the actual
  pair.
- Refusal: *"Run optimization on this route now."* → declines, citing
  app scope.
- Hallucination guard: *"Cash to collect on stop 50?"* → "I can't see
  that in this view," not a fabricated number.

Abstraction integrity check passes:
`grep -rn 'sample-data\|sampleRoutes\|sampleCenters\|buildStopsForRoute\|getCenterDepot' src/agents src/lib/chat src/app/api/chat src/components/chat`
returns matches only inside `src/lib/chat/data-source.ts`.

Env: requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`. New
deps: `@ai-sdk/google`, `@ai-sdk/react`, `ai`, `react-markdown`.

Informed by:

- `wiki/contracts/data-models.md` — `Route`, `Center`,
  `Customer`/`Driver`/`Truck`, `DeliveryStop` shapes used in the
  snapshots.
- `wiki/contracts/api-contract.md` — `/api/v1/db/*` (live) and
  `/api/v1/data/centers` (proposed) — drove the data-source's per-method
  source-of-truth table.
- `wiki/frontend/agent-instructions.md` — Core Pages mapped 1:1 to the
  five chat surfaces; Frontend Mission scope (no optimization, no KPI
  comparison, no pick list, no export) drove the agent's refusal rules;
  UI Rules ("compact panels", "don't hide warnings") shaped the panel
  sizing and the visible "Seeing X" pill.
- `wiki/log.md` (2026-05-09 setup entry) — endorsed the read-only
  single-turn pattern: *"Use OpenAI Agents SDK only for explanations
  and generated operational summaries."* We swapped the agent runtime
  for the AI SDK direct path; the architectural shape is identical.

## [2026-05-09] frontend | README + repo cleanup

Cleaned up onboarding noise after the centers-first flow stabilized.

- Root `README.md` rewritten to describe the actual centers → routes →
  RouteHero entry flow (replacing the earlier planner-first description).
- A stale `package.json` artifact left over from an early scaffold was
  removed; `pnpm-lock.yaml` is the source of truth alongside the real
  `package.json`.

Informed by:

- `wiki/frontend/agent-instructions.md` — Core Pages / Main UX Flow.
- `wiki/log.md` — prior centers + route hero entries.

## [2026-05-09] frontend | Add Route modal

`src/components/routes/AddRouteModal.tsx` is now wired into
`CenterDetailPage`. Users open it from the routes table to create a new
route scoped to the current center.

- Form built with `react-hook-form` + Zod (matching the `Route` schema in
  `src/components/routes/columns.tsx`).
- Submission appends a row to the in-memory route list. Backend route CRUD
  endpoints are not implemented yet, so the modal is local-only — refresh
  loses changes.
- A follow-up fix corrected a layout/state issue in the modal (commit
  `ec39ee2`); the component now closes cleanly and resets between opens.

Informed by:

- `wiki/contracts/data-models.md` — frontend `Route` mock schema (the
  reduced `code` / `truck_code` / `centerId` shape).
- `wiki/frontend/design.md` — dialog and form-input sizing.
- `wiki/frontend/agent-instructions.md` — UI Rules ("do not hide warnings",
  compact panels).

## [2026-05-09] frontend | App directory reorganization

Split `src/app/` into Next.js route groups:

- `(app)/` — authenticated app surfaces: `/`, `/centers/[id]`, `/clients`,
  `/drivers`, `/trucks`, `/preview/route/[id]`. Shares the app shell layout.
- `(auth)/` — unauthenticated surfaces: `/login`. No app chrome.

No URL changed externally (route groups are URL-invisible). The split
unblocks future per-group layouts (e.g. an auth-only background) and keeps
the login page out of the sidebar shell.

Informed by:

- `wiki/frontend/agent-instructions.md` — Core Pages.
- Next.js App Router route-group conventions.

## [2026-05-09] frontend | Fake login + routes-view scaffold

Added `/(auth)/login` as the demo entry point, plus the routes-view
scaffold that landed alongside it.

- `src/app/(auth)/login/page.tsx` renders a `LoginForm`. Credentials are
  not validated against a backend — submission redirects into the centers
  picker. This exists so the demo has an obvious entry surface; real auth
  is out of scope until the backend exposes it.
- The routes view inside `CenterDetailPage` was tightened (filtering,
  sorting, sample data) to support the centers → routes → RouteHero flow
  end-to-end.

Informed by:

- `wiki/frontend/agent-instructions.md` — Core Pages, UI Rules.
- `wiki/frontend/design.md` — form input + button sizing.

## [2026-05-09] frontend | Route map tab — polyline + stop simulation

Built out the `Mapa` tab on the route detail surface, replacing the
placeholder. The `Camión` ↔ `Mapa` tabs are now the route-level navigation
(no per-page back button or truck-type chip), and the page lays out
tabs-on-top → KPI cards inline with the route code → tab content stretching
to fill the viewport without scrolling.

- New `RouteMapTab` (`src/components/routes/RouteMapTab.tsx`, MapLibre GL
  directly; the mapcn `Map` / `MapRoute` / `MapMarker` helpers from
  `wiki/frontend/agent-instructions.md` are still planned) renders the depot
  and ordered stops with a mock connector line between them. **Pending:**
  the real OSRM polyline (`route_geojson`), partial-route streaming, and an
  animated truck marker — these arrive with `RouteResult` payloads.
- The right panel hosts the stop list (sequence pin, customer, ETA, time
  window, status pill) and a simulation control bar (Play / Pause / Reset,
  1× / 4× / 16× speeds). Animation drives the current-position marker only;
  it is not yet wired to a real polyline.
- Mock stop data comes from `route-stops.ts`. The `RouteStop` shape mirrors
  `wiki/contracts/data-models.md` → `DeliveryStop` and
  `damm-backend/models/domain.py:DeliveryStop` (`time_window`,
  `estimated_arrival`, `service_time_min`). Real data will swap in via the
  backend `RouteResult.ordered_stops` job result.
- `Center` (frontend) gained optional `lat`/`lng`, mirroring
  `damm-backend/models/catalog.py:WarehouseBase`. These act as the route
  depot in the map view until centers are returned by the backend.

Informed by:

- `wiki/contracts/data-models.md` — `DeliveryStop`, `TimeWindow`,
  `RouteResult.ordered_stops`, `Center`.
- `damm-backend/models/domain.py` and `models/catalog.py` — authoritative
  `DeliveryStop` and `Warehouse` shapes.
- `wiki/frontend/agent-instructions.md` — mapcn + MapLibre stack guidance
  noted in the previous `RouteMapTab` placeholder.

## [2026-05-09] frontend | Route Hero merged with CRUD Center/Route work

Reconciled `feat/route-hero-section` with `feat/crud-centers+routes` after
both shipped to dev in parallel. Adopted the CRUD branch's structure as the
backbone and plugged the hero into it:

- `CentersListPage` now navigates with `router.push("/centers/[id]")` (CRUD
  branch's pattern). The earlier in-page `selectedCenter` state was dropped.
- The earlier `CenterRoutesView` orchestration (an inline view inside
  `CentersListPage`, never extracted as its own component) was dropped; the
  routes table now lives directly in `CenterDetailPage` from the CRUD
  branch.
- `Route` schema is the CRUD branch's: `code`, `truck_code`, `centerId`
  (camelCase). Dropped the hero's `transport_id`, `route_code`,
  `truck_type`, `distance_km`, `duration_min` fields.
- `RouteHero` now resolves capacity through a lookup of `truck_code` in
  `sampleTrucks` (CRUD branch's mock), which gives the real `truck_type`
  and `capacity_pallets`. `Slots N/M` and load percent are now consistent
  with the route's truck.
- `sample-data.ts` ships a `buildTruckVisualization(truckType)` builder
  with truck-type-specific dimensions and pallet layouts:
  - `van`  → 380×180×200 cm, 2 pallets out of 3 capacity.
  - `6pal` → 540×240×240 cm, 5 pallets out of 6 capacity.
  - `8pal` → 700×240×240 cm, 6 pallets out of 8 capacity (was the only
    case before, now applied per truck type).
- `KpiStrip` lost the Distance / Duration KPIs (not in the CRUD schema).
  Will come back when real `RouteResult` payloads arrive.
- `/preview/route/[id]` updated to the new sample IDs (101..901).

Bug fixed:

- Review flagged that the hero passed the same `sampleTruckVisualization`
  regardless of truck. `/preview/route/5` (a van) showed `Slots 6/4 = 150%`
  in a 620 cm box. Now resolved at the visualization layer rather than by
  filtering out vans.

## [2026-05-09] frontend | Route Hero Section (truck + map tabs, temporary)

Added a route hero section that opens when a route is selected. The hero
contains two tabs: **Camión** (3D wireframe of the loaded truck) and **Mapa**
(placeholder for the teammate working on map rendering).

Surface and routing:

- Routes are nested under each logistics centre rather than living as a
  top-level sidebar destination. Flow: `Centers → click center →
  CenterDetailPage (routes table filtered by center_id) → click route →
  RouteHero`.
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
- The inline routes-view scaffold inside `CentersListPage` (originally
  sketched as `CenterRoutesView` but never extracted) was a placeholder to
  unblock the truck tab; the centres team has since rewired the navigation
  through `CenterDetailPage` at `/centers/[id]`.
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
