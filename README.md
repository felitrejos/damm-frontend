<h1 align="center">SmartTruck · damm-frontend</h1>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&logoColor=white" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white" />
  <img alt="MapLibre GL" src="https://img.shields.io/badge/MapLibre%20GL-396CB2?logo=maplibre&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" />
</p>

**Damm's delivery-route planner.** Turns a fleet, a list of clients, and their delivery windows into optimized truck routes — driver, vehicle, stop order, pallet layout, and the full timeline for the day. Compares the optimizer's plan against the baseline so dispatchers can see what changes and why before sending a truck out.

_Built for the Damm × Interhack BCN hackathon._

---

## Stack

- **Next.js 15** App Router (Turbopack dev) on **React 19**
- **TypeScript**, **Tailwind CSS v4**, **base-ui** + shadcn primitives
- **MapLibre GL** for the planner map (zone clusters, arc layers, route lines)
- **react-hook-form** + **zod** at every form boundary
- **TanStack Table** for the data grids
- **motion** for the polish (shiny CTA, shimmer loaders, modal resize)
- **three.js** + **@react-three/fiber** for the truck pallet visualization

---

## Get it running

This frontend talks to the [damm-backend](https://github.com/josep-audenis/damm-backend) FastAPI server. **Start the backend first** (default `http://localhost:8000`).

```bash
pnpm install
pnpm dev         # http://localhost:3000 — Turbopack
pnpm typecheck
pnpm build
```

Override the backend URL with an env var if it lives elsewhere:

```bash
NEXT_PUBLIC_API_BASE_URL=http://10.0.0.5:8000 pnpm dev
```

Default is `http://localhost:8000`. See [`src/lib/api/client.ts`](src/lib/api/client.ts).

---

## Backend wiring

All reads and writes go through a thin Zod-validated client in [`src/lib/api/`](src/lib/api/):

| Module | Hits | Used for |
| --- | --- | --- |
| [`catalog.ts`](src/lib/api/catalog.ts) | `/api/v1/db/{customers,trucks,drivers}` | Catalog tables (`/clients`, `/trucks`, `/drivers`) |
| [`warehouses.ts`](src/lib/api/warehouses.ts) | `/api/v1/db/warehouses` (+ catalog POST/PATCH/DELETE) | Centers list + Add/Edit/Delete center modals |
| [`transports.ts`](src/lib/api/transports.ts) | `/api/v1/data/transports` and `/transport/{id}` | Routes table on a center, route detail in `RouteHero` |
| [`orders.ts`](src/lib/api/orders.ts) | `/api/v1/db/orders` | Derives the available-dates set for the date picker |
| [`optimize.ts`](src/lib/api/optimize.ts) | `/api/v1/optimize/full/preview` and `/persist` | Generates and saves suggested routes from `AddRouteModal` |

The optimizer runs in **preview mode** when the user clicks _Generate Routes_ — three parallel calls with different parameters give three suggestions in ~20s. _Save selected route_ then calls `/optimize/persist` to commit it as a real transport.

---

## What's in the box

```
src/
  app/                     Next App Router — (app) and (auth) groups
  components/
    auth/                  Login screen
    centers/               Warehouse list + detail; Add/Edit modals
    clients/               Customer table (lives off backend)
    drivers/  trucks/      Catalog tables (live off backend)
    routes/                Route table, hero, map view, AddRouteModal,
                           RouteReviewPanel (zone clusters), 3D truck viz
    shared/                DataTable, ConfirmDeleteDialog, generic patterns
    shell/                 App chrome (header, sidebar, layout)
    ui/                    base-ui wrappers, MapLibre primitives,
                           ShinyText / TextShimmer / WanderingEyes
  lib/
    api/                   Backend client (see Backend wiring table above)
    chat/                  Planner chat surface + visible-context builder
```
