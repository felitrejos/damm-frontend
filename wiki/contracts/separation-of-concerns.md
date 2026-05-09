# Separation Of Concerns

Frontend and backend are developed in separate repos. This page defines
ownership boundaries for the live scope.

## Shared Contract Owns

The shared wiki contract (`wiki/contracts/*`) owns:

- Endpoint paths.
- Request and response schemas.
- Enum values.
- Domain vocabulary.
- Visualization payload shape (`TruckVisualization`, `VizPallet`).

Neither repo should silently change these.

## Backend Owns

- Reading Excel files.
- Normalizing Damm/DDI operational data.
- Geocoding (so customers/centers can carry `lat`/`lng`).
- Serving the `/api/v1/db/*` directory endpoints.
- Serving `/api/v1/data/centers` once implemented.
- Health endpoint.

The backend does **not** own:

- React component layout.
- MapLibre rendering details.
- Client-side state management.
- Visual styling.

## Frontend Owns

- Next.js routing.
- User workflow (centers → routes → RouteHero).
- Map rendering (MapLibre).
- Truck visualization rendering (R3F + three.js).
- Error and empty states.
- Local mock data that conforms to the contract (centers, routes,
  route stops) until backend endpoints are available.

The frontend does **not** own:

- Data normalization.
- Geocoding.
- Authoritative customer / driver / truck records.

## Shared Development Rule

If a developer needs a field that is not in the contract:

1. Add a local code TODO or mock adapter.
2. Propose the field in `wiki/decisions/`.
3. Add a log entry.
4. Do not assume the other repo already has it.

## Naming Rule

Backend payloads use the Pydantic model names from the contract; JSON
field names are snake_case. Frontend may map snake_case to camelCase
internally, but the API client layer must preserve the backend contract.
