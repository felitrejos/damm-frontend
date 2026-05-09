# Data Models Contract

Shared model contract between backend and frontend. Field names, enum
values, and message types must not change silently.

The models are derived from DDI operational documents:

- Hoja Carga: warehouse pick/load sheet.
- Hoja Ruta: driver route sheet.
- Albaran: delivery invoice.

## File Targets

Backend (Python / Pydantic):

```txt
app/domain/models.py
app/domain/enums.py
app/api/schemas.py
```

Frontend (TypeScript / Zod):

```txt
src/lib/schemas/domain.ts
src/lib/api/catalog.ts        # Customer / Driver / Truck for /db/* endpoints
src/components/centers/columns.tsx   # Center (frontend mock)
src/components/routes/columns.tsx    # Route (frontend mock)
```

## Enums

```python
class TruckType(str, Enum):
    TRUCK_6 = "6pal"
    TRUCK_8 = "8pal"
    VAN = "van"

class PaymentCondition(str, Enum):
    CONTADO = "CONTADO"
    CREDITO = "CREDITO"

class ProductUnit(str, Enum):
    CAJ = "CAJ"
    PAL = "PAL"
    UN = "UN"
    BOT = "BOT"
    BRL = "BRL"
    TUB = "TUB"
    PAK = "PAK"

class ProductCategory(str, Enum):
    BEER_BOTTLE = "beer_bottle"
    BEER_BARREL = "beer_barrel"
    WATER = "water"
    SOFT_DRINK = "soft_drink"
    DAIRY = "dairy"
    COFFEE = "coffee"
    WINE_SPIRITS = "wine_spirits"
    FOOD = "food"
    DISPOSABLE = "disposable"
    MERCHANDISE = "merchandise"
    GAS = "gas"
    RETURNABLE_EMPTY = "returnable_empty"
```

## Primitive Models

```python
class TimeWindow(BaseModel):
    open: time
    close: time
```

## Product Models

```python
class ProductDimensions(BaseModel):
    length_cm: float = 40.0
    width_cm: float = 30.0
    height_cm: float = 25.0
    volume_l: float | None = None
    weight_gross_kg: float = 15.0
    weight_net_kg: float | None = None

class ProductLine(BaseModel):
    material_code: str
    description: str
    quantity: int
    unit: ProductUnit
    category: ProductCategory
    is_returnable: bool
    warehouse_location: str | None
    dimensions: ProductDimensions | None = None
    unit_price: Decimal | None = None
    discount_pct: Decimal | None = None
    net_amount: Decimal | None = None
    vat_rate: Decimal | None = None

class ReturnableItem(BaseModel):
    material_code: str
    description: str
    quantity: int
    unit: ProductUnit
    volume_l: float | None = None
    weight_kg: float | None = None
```

## Delivery Models

Used by the route map's stop list (currently driven by the
`route-stops.ts` mock; real data will come from the backend).

```python
class DeliveryStop(BaseModel):
    stop_id: str
    sequence: int
    customer_id: str
    customer_name: str
    address: str
    postal_code: str
    city: str
    lat: float | None = None
    lng: float | None = None
    time_window: TimeWindow | None = None
    shift: Literal[1, 2] = 1
    estimated_arrival: time | None = None
    products: list[ProductLine] = []
    returnables: list[ReturnableItem] = []
    payment_condition: PaymentCondition = PaymentCondition.CREDITO
    invoice_total: Decimal | None = None
    cash_to_collect: Decimal = Decimal("0")
    albaran_numbers: list[str] = []
    travel_time_from_prev_min: float | None = None
    distance_from_prev_km: float | None = None
```

## Visualization Models

Used by the truck wireframe scene
(`src/components/routes/TruckWireframeScene.tsx`).

```python
class TruckVisualization(BaseModel):
    truck_dims: dict = Field(default={"length_cm": 620, "width_cm": 240, "height_cm": 240})
    pallet_dims: dict = Field(default={"length_cm": 120, "width_cm": 80, "height_cm": 15})
    pallets: list[VizPallet] = []
    route_geojson: dict | None = None

class VizPallet(BaseModel):
    pallet_id: str
    label: str
    color: str
    position: dict
    dims: dict
    is_return: bool = False
    stop_ids: list[str] = []
    products_summary: list[str] = []
```

Coordinate convention:

```txt
Origin: front-left-floor corner of truck cargo area.
x = truck length, 0 means front.
y = truck width.
z = height.
Units are centimeters.
```

## Directory Models

These back the `/clients`, `/drivers`, `/trucks` pages via
`/api/v1/db/*`. Frontend Zod definitions live in
`src/lib/api/catalog.ts`.

```python
class Customer(BaseModel):
    id: int
    code: str
    name: str
    name_2: str | None = None
    address: str | None = None
    postal_code: str | None = None
    city: str | None = None
    payment_condition: str | None = None
    service_notes: str | None = None
    lat: float | None = None
    lng: float | None = None

class Driver(BaseModel):
    id: int
    code: str
    name: str

class Truck(BaseModel):
    id: int
    code: str
    plate: str | None = None
    truck_type: str
    capacity_pallets: int
    warehouse_id: int | None = None
    active: bool
```

## Center

Backs the centers picker on `/`. Defined in
`src/components/centers/columns.tsx`; sample data in
`src/components/centers/sample-data.ts`.

```python
class Center(BaseModel):
    id: int
    center: str          # display name
    location: str        # zone / region
    routes: int          # number of active routes operated from this center
    admin: str           # admin / contact name
    lat: float | None = None   # mirrors Warehouse.lat (damm-backend/models/catalog.py)
    lng: float | None = None   # depot position used by the route map
```

See `wiki/decisions/2026-05-09-centers-model.md` for the proposal.

## Route (frontend mock)

The frontend uses a leaner `Route` schema for the centers→routes table.
It is mock-only and lives entirely in the frontend until/if the backend
exposes a route endpoint.

Defined in `src/components/routes/columns.tsx`:

| Field         | Type   | Notes                                          |
|---------------|--------|------------------------------------------------|
| `id`          | number | Local row id (frontend-only).                  |
| `code`        | string | Display code.                                  |
| `driver_name` | string | Driver display name.                           |
| `truck_code`  | string | Resolves to a truck in `sampleTrucks` (mock).  |
| `stops`       | number | Stop count.                                    |
| `date`        | string | ISO `YYYY-MM-DD`.                              |
| `centerId`    | number | Scopes the route to a `Center`.                |

## Health

```python
class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    data_loaded: bool
    customer_count: int
    transport_count: int
    geocoded_count: int
```

## Evolution Rule

Adding optional fields is allowed. Renaming fields, changing enum values,
or changing endpoint paths requires a contract proposal in
`wiki/decisions/`.
