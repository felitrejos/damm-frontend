# API Contract

Live frontend ↔ backend endpoints used by the app.

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

## Contract Rule

Endpoint paths, request/response field names, and enum values must not
change silently. Add new fields freely; renaming or removing requires a
proposal in `wiki/decisions/`.
