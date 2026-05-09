# 2026-05-09 Add Center Model + Centers Endpoint

**Status:** proposed

## Context

The frontend `/` landing previously showed a stub for a transport selector.
Product direction shifted to a two-step flow: first pick a distribution
**center**, then plan a route from that center. The first screen is now a
table of centers (sortable, filterable) instead of a transport selector.

The existing contract has `TransportSummary`, `CustomerDetail`, and
`OptimizationResult` but no notion of a distribution center. Centers don't
currently map to any backend endpoint or Pydantic model.

## Decision

Add a `Center` Pydantic model and a `GET /api/v1/data/centers` endpoint.

```python
class Center(BaseModel):
    id: int
    center: str       # display name (e.g. "Barcelona Norte")
    location: str     # zone / region (e.g. "Cataluña")
    routes: int       # active route count operated from this center
    admin: str        # admin / contact name
```

```txt
GET /api/v1/data/centers   ->   list[Center]
```

## Frontend Impact

- `src/components/centers/DataTable.tsx` consumes `list[Center]` rows.
- `src/components/centers/sample-data.ts` ships placeholder rows until the
  endpoint is live.
- `src/app/page.tsx` renders the centers picker.
- The transport selector (issue 03 in the implementation order) now applies
  per-center; the existing `TransportSummary` flow is unchanged once a center
  is selected.

## Backend Impact

- New endpoint `/api/v1/data/centers`.
- New `Center` Pydantic model in `app/api/schemas.py` (or `app/domain/models.py`).
- Sourcing: TBD — likely derived from existing transport/customer data
  grouped by depot, or a separate seed file.

## Migration Notes

- No field rename or removal in existing models.
- Frontend swaps `sample-data.ts` for a fetch + Zod parse against
  `GET /api/v1/data/centers` once available.
- If `routes` and `admin` need different sourcing semantics on the backend,
  a follow-up proposal can refine the field types (e.g. `admin_email`,
  `route_count` derived from joins) — those would be additive.
