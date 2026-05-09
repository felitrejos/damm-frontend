# API Contract

Frontend ↔ backend endpoints used by the app, plus the proposed endpoints
the backend still needs to expose so the frontend can drop its placeholder
mocks.

## Data Source Status

| Surface                      | Today                       | Backend will provide                           |
|------------------------------|-----------------------------|------------------------------------------------|
| `/clients`                   | `GET /api/v1/db/customers`  | ✅ live                                        |
| `/drivers`                   | `GET /api/v1/db/drivers`    | ✅ live                                        |
| `/trucks`                    | `GET /api/v1/db/trucks`     | ✅ live                                        |
| `/` (centers picker)         | `sample-data.ts` mock       | `GET /api/v1/data/centers` (proposed)          |
| `/centers/[id]` routes table | mock rows in component      | `GET /api/v1/data/routes?center_id=…` (proposed) |
| RouteHero → Mapa stops       | `route-stops.ts` mock       | `GET /api/v1/data/routes/{route_id}/stops` (proposed) |
| RouteHero → Camión truck viz | built locally from `truck_code` capacity | n/a — frontend-owned (no load planner in scope) |
| Health badge (if added)      | not displayed               | `GET /api/v1/health` (live)                    |

The frontend mocks all validate against the shared Zod schemas; swapping
to real endpoints should be a fetch-only change.

## Base URL

```txt
http://localhost:8000
```

API base path:

```txt
/api/v1
```

## Endpoints

### Health

```txt
GET /api/v1/health
```

Response: `HealthResponse` (see `wiki/contracts/data-models.md`).

### Database directory

These back the `/clients`, `/drivers`, and `/trucks` directory pages.
The frontend Zod schemas live in `src/lib/api/catalog.ts`.

```txt
GET /api/v1/db/customers?limit=10000
GET /api/v1/db/drivers?limit=10000
GET /api/v1/db/trucks?limit=10000
```

Response: `list[Customer]`, `list[Driver]`, `list[Truck]` respectively.

### Centers (proposed)

```txt
GET /api/v1/data/centers
```

Response: `list[Center]`. Backs the centers picker on `/`.
See `wiki/decisions/2026-05-09-centers-model.md`. Until the backend
implements this, the frontend reads `src/components/centers/sample-data.ts`.

### Routes (proposed)

```txt
GET /api/v1/data/routes?center_id={center_id}
GET /api/v1/data/routes/{route_id}/stops
```

The first returns `list[Route]` (the frontend-mock shape in
`wiki/contracts/data-models.md` → "Route (frontend mock)"), scoped to a
center. The second returns `list[DeliveryStop]` for the RouteHero map
panel. Until these exist, the frontend uses the in-component mock rows
and `src/components/routes/route-stops.ts`.

## Contract Rule

Endpoint paths, request/response field names, and enum values must not
change silently. Add new fields freely; renaming or removing requires a
proposal in `wiki/decisions/`.
