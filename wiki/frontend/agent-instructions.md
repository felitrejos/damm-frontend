# Frontend Agent Instructions

Read these before modifying the frontend repo.

## Required Context

Read in order:

1. `wiki/index.md`
2. `wiki/contracts/data-models.md`
3. `wiki/contracts/api-contract.md`
4. `wiki/contracts/separation-of-concerns.md`

## Frontend Mission

Operations console for Damm logistics. The current scope is:

- Browse distribution centers and the routes operated from each.
- Inspect a route via the **RouteHero**: a 3D truck wireframe (Camión tab)
  and a depot/stops map with a simulation control bar (Mapa tab).
- Browse customer, driver, and truck directories backed by the backend
  database endpoints.
- Create new routes locally via the AddRouteModal.

Optimization, KPI/comparison, pick list, and export surfaces are **not in
scope** for this frontend. Remaining work is wiring frontend ↔ backend for
the live data endpoints already used.

## Required Stack

Cross-check against root `package.json` before assuming anything is present.

- Next.js 15 App Router (Turbopack dev).
- React 19 + TypeScript.
- Tailwind CSS v4.
- shadcn/ui (built on `@base-ui/react`) for tables, dialogs, tabs, buttons, dropdowns, and form controls.
- `@tanstack/react-table` for directory and route tables.
- `react-hook-form` + `@hookform/resolvers` for forms (e.g. `AddRouteModal`).
- MapLibre GL (`maplibre-gl`) for the route map.
- `three` + `@react-three/fiber` + `@react-three/drei` for the truck wireframe scene.
- Zod for API response and form validation.
- `motion` for component-level animation.
- `@tabler/icons-react` and `lucide-react` for icons.
- `date-fns` + `react-day-picker` for date controls.

## Core Pages

Actual app router layout (`src/app/`):

- `/(auth)/login` — fake login form. Demo entry; no real auth.
- `/(app)/` — **centers picker**: data table of distribution centers (sortable, filterable). Landing screen.
- `/(app)/centers/[id]` — center detail. Routes `DataTable` for the center plus the **RouteHero** (Camión / Mapa tabs) when a route is selected. Hosts the `AddRouteModal`.
- `/(app)/clients` — customers directory, server-rendered from `GET /api/v1/db/customers?limit=10000`.
- `/(app)/drivers` — drivers directory, server-rendered from `GET /api/v1/db/drivers?limit=10000`.
- `/(app)/trucks` — trucks directory, server-rendered from `GET /api/v1/db/trucks?limit=10000`.
- `/(app)/preview/route/[id]` — dev-only direct entry to RouteHero. Remove once routes have real URLs.

## Contract Rules

- Use the contract models exactly at the API boundary.
- Do not invent backend fields.
- If using mock data, it must validate against the shared schemas in `src/lib/schemas/domain.ts`.
- Accept snake_case fields from backend.

## Main UX Flow

```txt
/(auth)/login  (fake)
  -> /  (centers picker)
  -> click center
  -> /centers/[id]  (routes table + RouteHero on selection)
  -> click route
  -> RouteHero { Camión | Mapa } tabs
```

## Visualization Rules

Map (RouteMapTab):

- MapLibre GL.
- Show depot, numbered stops, route line, selected stop state.

Truck (TruckWireframeScene):

- Use the `TruckVisualization` shape from `wiki/contracts/data-models.md`.
- Interpret coordinates in centimeters.
- The backend gives geometry; frontend owns visuals.
- Build the truck layout as custom React + R3F, not as a map layer.
- Support 6/8 pallet slots and the van layout (3 slots).
- Show front/rear orientation and left/right side access.
- Slot cells may show assigned stop range, clients, material categories, returnable risk, heavy/fragile/bulky badges, and unload order.
- Keep slot dimensions stable across loading, hover, and selected states.

## UI Rules

- This is an operations app, not a marketing site.
- First screen should help the user start work.
- Use compact, readable panels.
- Keep truck slots dimensionally stable.
- Make errors obvious.
- Do not hide warnings.
- Keep controls feature-complete enough for a live demo.
- Prefer tabs/drawers over cramped multi-column layouts on mobile.
- Do not use the map to represent truck loading.

## Logging Wiki Changes

If you need a contract change:

1. Update local `wiki/contracts/*` only as a proposal.
2. Add a line to `wiki/log.md`.
3. Add a decision page in `wiki/decisions/`.
4. Mention the contract change in your final response or PR notes.
