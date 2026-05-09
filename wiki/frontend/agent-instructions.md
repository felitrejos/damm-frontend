# Frontend Agent Instructions

Read these before modifying the frontend repo.

## Required Context

Read in order:

1. `wiki/index.md`
2. `wiki/contracts/data-models.md`
3. `wiki/contracts/api-contract.md`
4. `wiki/contracts/separation-of-concerns.md`

## Frontend Mission

Build the SmartTruck planner UI:

- Select a transport.
- Show current route/order data: clients, materials, estimated volume, returnables, and time windows.
- Let the user choose date, route/transport, truck type, and optimization strategy.
- Start optimization.
- Open WebSocket progress.
- Render partial route as soon as available.
- Render final route, stop timeline, truck visualization, pick list, KPIs, baseline comparison, and explanations.
- Let users inspect each stop.
- Provide export/pitch views.

## Required Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui for tables, dialogs, tabs, buttons, command menu, and form controls.
- mapcn + MapLibre GL for the route map.
- TanStack Query for backend fetches and caching.
- Zod for API response and form validation.
- Zustand for local planning state.
- Recharts or Tremor for KPI/comparison charts.
- Generated OpenAPI TypeScript client when the FastAPI schema is available.

## Core Pages

- `/`: scenario selector and overview.
- `/planner`: select date, route, transport, truck type, and optimization strategy.
- `/planner/[planId]`: main demo workspace with map, stop timeline, truck load, KPIs, explanations, and warnings.
- `/compare/[planId]`: baseline vs SmartTruck comparison.
- `/data`: data quality view for missing coordinates, missing volumes, and time-window coverage.
- `/export/[planId]`: driver sheet, warehouse loading sheet, and pitch-ready summary.

## Contract Rules

- Use the contract models exactly at the API boundary.
- Do not invent backend fields.
- If using mock data, it must validate against the shared schemas.
- Accept snake_case fields from backend unless a generated client maps them.
- Recognize exact WebSocket message types: `progress`, `partial`, `result`, `done`, `error`.
- Recognize exact progress phase keys from `api-contract.md`.

## Implementation Order

1. App shell.
2. Zod schemas or generated OpenAPI client.
3. Transport selector.
4. Planner setup form: date, route/transport, truck type, strategy.
5. Optimize button.
6. WebSocket job hook.
7. Progress UI.
8. Route map.
9. Stop list and timeline.
10. Truck visualization.
11. Pick list panel.
12. KPI and comparison panel.
13. Explanations.
14. Data quality view.
15. Export views.

## Main UX Flow

```txt
Select transport
  -> show current route/order data
  -> choose strategy
  -> POST /api/v1/optimize/full
  -> connect WS /ws/jobs/{job_id}
  -> show progress
  -> render WsPartialResult route
  -> render WsResult route/load/viz/pick list
  -> close on WsDone
```

## Visualization Rules

Map:

- Use mapcn + MapLibre.
- Show depot, numbered stops, route line, selected stop state.
- Render `route_geojson` if available.

Truck:

- Use `TruckVisualization`.
- Interpret coordinates in centimeters.
- Do not ask backend for rendering-specific CSS.
- The backend gives geometry; frontend owns visuals.
- Build the truck layout as custom React, not as a map layer.
- Support 6/8 pallet slots.
- Show front/rear orientation and left/right side access.
- Slot cells may show assigned stop range, clients, material categories, returnable risk, heavy/fragile/bulky badges, and unload order.
- Keep slot dimensions stable across loading, hover, and selected states.

Planner workspace:

- Left panel: stops, filters, warnings, time windows.
- Center: mapcn map with route and numbered client markers.
- Right panel: truck layout with side access and color-coded delivery groups.
- Bottom panel: KPIs, explanation, and baseline comparison.
- Stop selection must sync across the stop list, map, truck slots, and explanation context.

## UI Rules

- This is an operations app, not a marketing site.
- First screen should help the user start planning.
- Use compact, readable panels.
- Keep truck slots dimensionally stable.
- Make progress and errors obvious.
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
