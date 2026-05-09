# SmartTruck Wiki Log

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
