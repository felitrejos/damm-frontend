# 2026-05-10 Truck Load Visualization Contract

**Status:** accepted

## Context

The truck wireframe scene (`src/components/routes/TruckWireframeScene.tsx`)
was originally fed by a frontend-only `TruckVisualization` shape. The
docs explicitly stated *"the backend is not expected to provide
TruckVisualization payloads (load planning is out of scope)"* — so the
sidebar list, the 3D scene, and the sample data all consumed an internal
`VizPallet` that carried `label`, `stop_ids[]`, `products_summary[]` and
a kind derived by regex over product names.

Load planning has since landed server-side
(`damm-backend/services/optimization.py`). The backend now ships a
load-plan structure with grid coordinates (`column`, `row`), per-pallet
loaded height, server-derived `kind`, and structured product objects.
Continuing to render against the old `VizPallet` would mean either:

- maintaining a regex classifier in the frontend that's already
  authoritative on the backend, or
- shipping invented heights / labels that diverge from the real plan.

## Decision

Adopt the backend's `TruckLayout` as the wire contract and introduce a
small adapter (`src/components/routes/palletAdapter.ts`) that maps it to
a domain `TruckVisualization` for the React components.

Concretely:

- Add wire types `TruckLayout`, `TruckSlot`, `BackendProduct` in
  `src/components/routes/types.ts`. Field names match the backend
  (`material_code`, `description`, `quantity`, `unit`,
  `loaded_height_cm`, `kind`).
- Reshape `VizPallet`: drop `label`, `stop_ids[]`, `products_summary[]`;
  add `customer_name`, `sequence`, `kind`, `total_volume_l`,
  `total_weight_kg`, structured `products: Product[]`.
- `adaptTruckLayout(layout)` derives `position{x,y,z}` from
  `(column, row)` × `pallet_dims_cm`, fills empty grid cells with
  bare-base placeholder pallets (so the 3D scene shows the truck at
  full capacity), and renames product fields to the UI-friendly form
  (`material_code → sku`, `description → name`, `quantity → cases`).
- `palletColor.ts` reads `pallet.kind` directly — the regex
  `detectPalletItemKind` is removed.

Returnables (`is_return: true` slots and the consolidated
`return_pallet`) are filtered out by the v1 adapter and deferred for a
follow-up.

## Frontend impact

- `RouteTruckTab.tsx` renders the structured product list in the
  detail panel (name + qty in a unit-aware label: cases / barrels /
  units / packs) and the customer name + stop sequence as the row
  header. Selection is click-to-expand; hover and selection are
  separate states with selection winning.
- `sample-data.ts` produces `TruckLayout` and runs through the
  adapter, so the demo path exercises the same bridge the real
  payload will hit.
- The 3D scene renders barrel pallets as 2×2 cylinders (driven by
  `kind`) and case pallets as stacked layer boxes.

## Open questions

- Short SKU column (e.g. `ED13`) is not in the master data yet; the
  frontend uses `material_code` UUIDs as React keys and shows the
  product `description` for display.
- `units_per_case` is not in master data; until it lands the detail
  panel won't show the "60 × 24 = 1.440 units" expansion.
- Shared multi-customer pallets ship `customer_name` as a
  slash-joined string (`"A / B"`) and a flat mixed `products[]`.
  Per-customer breakdown can be revisited if/when the UX needs it
  (would require `customer_names: list[str]` + `products[].stop_id`).

## Evolution

Per the contracts/data-models Evolution Rule, any future field rename
or removal on `TruckLayout` / `TruckSlot` / `BackendProduct` requires a
new entry in this folder.
