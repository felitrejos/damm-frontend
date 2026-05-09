# Backend Agent Instructions

Read these before modifying the backend repo.

## Required Context

Read in order:

1. `wiki/index.md`
2. `wiki/contracts/data-models.md`
3. `wiki/contracts/api-contract.md`
4. `wiki/contracts/separation-of-concerns.md`

## Backend Mission

Serve the Damm operational data the frontend needs:

- Load real Damm/DDI data.
- Normalize into the shared models.
- Expose the directory endpoints consumed by the frontend
  (`/api/v1/db/customers`, `/api/v1/db/drivers`, `/api/v1/db/trucks`).
- Expose `/api/v1/data/centers` once the `Center` model is implemented
  (see `wiki/decisions/2026-05-09-centers-model.md`).
- Geocode customers and centers so `lat`/`lng` are populated.
- Health endpoint.

Optimization, load planning, pick lists, WebSocket progress, exports, and
OpenAI explanations are **not in current scope**. If they're added later,
contract them through `wiki/decisions/` first.

## Contract Rules

- Implement Pydantic models from `wiki/contracts/data-models.md`.
- Keep JSON field names snake_case.
- Do not rename fields without a contract proposal.
- Adding optional fields is allowed; renaming or removing is not.

## Implementation Order

1. Pydantic enums and models from the shared contract.
2. Health endpoint.
3. Data loader (Excel → normalized records).
4. `/api/v1/db/customers`, `/api/v1/db/drivers`, `/api/v1/db/trucks`.
5. Geocoding for customers (and centers when added).
6. `/api/v1/data/centers`.

## Logging Wiki Changes

If you change the backend contract:

1. Update local `wiki/contracts/*`.
2. Add a line to `wiki/log.md`.
3. Add a decision page in `wiki/decisions/`.
4. Mention the contract change in your final response or PR notes.
