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

```bash
pnpm install
pnpm dev         # http://localhost:3000 — Turbopack
pnpm typecheck
pnpm build
```

---

## What's in the box

```
src/
  app/                     Next App Router — (app) and (auth) groups
  components/
    auth/                  Login screen
    centers/               Warehouse list + detail page
    clients/               Customer table + sample data
    drivers/  trucks/      Catalog tables + sample data
    routes/                Route table, hero, map view, AddRouteModal
    shared/                DataTable, generic patterns
    shell/                 App chrome (header, sidebar, layout)
    ui/                    base-ui wrappers, MapLibre primitives,
                           ShinyText / TextShimmer / WanderingEyes
```
