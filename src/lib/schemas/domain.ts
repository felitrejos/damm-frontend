import { z } from "zod";

// Pydantic Decimal serializes to string by default; some encoders emit numbers.
// Accept both; downstream code formats for display.
const Decimal = z.union([z.string(), z.number()]);

// ---------- Enums ----------

export const TruckType = z.enum(["6pal", "8pal", "van"]);
export type TruckType = z.infer<typeof TruckType>;

export const PaymentCondition = z.enum(["CONTADO", "CREDITO"]);
export type PaymentCondition = z.infer<typeof PaymentCondition>;

export const ProductUnit = z.enum(["CAJ", "PAL", "UN", "BOT", "BRL", "TUB", "PAK"]);
export type ProductUnit = z.infer<typeof ProductUnit>;

export const ProductCategory = z.enum([
  "beer_bottle",
  "beer_barrel",
  "water",
  "soft_drink",
  "dairy",
  "coffee",
  "wine_spirits",
  "food",
  "disposable",
  "merchandise",
  "gas",
  "returnable_empty",
]);
export type ProductCategory = z.infer<typeof ProductCategory>;

export const OptimizationStatus = z.enum(["pending", "running", "done", "error"]);
export type OptimizationStatus = z.infer<typeof OptimizationStatus>;

// ---------- Primitives ----------

// Pydantic time -> "HH:MM:SS"; date -> "YYYY-MM-DD"; datetime -> ISO-8601 string.
export const TimeWindow = z.object({
  open: z.string(),
  close: z.string(),
});
export type TimeWindow = z.infer<typeof TimeWindow>;

// ---------- Product ----------

export const ProductDimensions = z.object({
  length_cm: z.number().default(40.0),
  width_cm: z.number().default(30.0),
  height_cm: z.number().default(25.0),
  volume_l: z.number().nullable().optional(),
  weight_gross_kg: z.number().default(15.0),
  weight_net_kg: z.number().nullable().optional(),
});
export type ProductDimensions = z.infer<typeof ProductDimensions>;

export const ProductLine = z.object({
  material_code: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unit: ProductUnit,
  category: ProductCategory,
  is_returnable: z.boolean(),
  warehouse_location: z.string().nullable(),
  dimensions: ProductDimensions.nullable().optional(),
  unit_price: Decimal.nullable().optional(),
  discount_pct: Decimal.nullable().optional(),
  net_amount: Decimal.nullable().optional(),
  vat_rate: Decimal.nullable().optional(),
});
export type ProductLine = z.infer<typeof ProductLine>;

export const ReturnableItem = z.object({
  material_code: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unit: ProductUnit,
  volume_l: z.number().nullable().optional(),
  weight_kg: z.number().nullable().optional(),
});
export type ReturnableItem = z.infer<typeof ReturnableItem>;

// ---------- Delivery ----------

export const DeliveryStop = z.object({
  stop_id: z.string(),
  sequence: z.number().int(),
  customer_id: z.string(),
  customer_name: z.string(),
  address: z.string(),
  postal_code: z.string(),
  city: z.string(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  time_window: TimeWindow.nullable().optional(),
  shift: z.union([z.literal(1), z.literal(2)]).default(1),
  estimated_arrival: z.string().nullable().optional(),
  products: z.array(ProductLine).default([]),
  returnables: z.array(ReturnableItem).default([]),
  payment_condition: PaymentCondition.default("CREDITO"),
  invoice_total: Decimal.nullable().optional(),
  cash_to_collect: Decimal.default("0"),
  albaran_numbers: z.array(z.string()).default([]),
  travel_time_from_prev_min: z.number().nullable().optional(),
  distance_from_prev_km: z.number().nullable().optional(),
});
export type DeliveryStop = z.infer<typeof DeliveryStop>;

// ---------- Pallet & Load ----------

export const PalletItem = z.object({
  product: ProductLine,
  layer: z.number().int(),
  column: z.number().int(),
  stack_height_cm: z.number(),
});
export type PalletItem = z.infer<typeof PalletItem>;

export const Pallet = z.object({
  pallet_index: z.number().int(),
  pallet_id: z.string(),
  stop_ids: z.array(z.string()),
  is_returnables: z.boolean().default(false),
  items: z.array(PalletItem).default([]),
  total_height_cm: z.number().default(0),
  total_weight_kg: z.number().default(0),
  total_volume_l: z.number().default(0),
  position_in_truck: z.record(z.string(), z.unknown()).default({}),
});
export type Pallet = z.infer<typeof Pallet>;

export const PickInstruction = z.object({
  sequence: z.number().int(),
  warehouse_location: z.string(),
  material_code: z.string(),
  description: z.string(),
  quantity: z.number().int(),
  unit: ProductUnit,
  pallet_id: z.string(),
  stop_id: z.string(),
});
export type PickInstruction = z.infer<typeof PickInstruction>;

export const LoadPlan = z.object({
  transport_id: z.string(),
  truck_type: TruckType,
  vehicle_id: z.string().nullable().optional(),
  date: z.string(),
  pallets: z.array(Pallet),
  pick_list: z.array(PickInstruction),
  items_no_location: z.array(ProductLine).default([]),
  return_pallet: Pallet.nullable().optional(),
  total_units_delivery: z.number().int().default(0),
  total_units_return: z.number().int().default(0),
  total_volume_delivery_l: z.number().default(0),
  total_volume_return_l: z.number().default(0),
  total_weight_delivery_kg: z.number().default(0),
  total_weight_return_kg: z.number().default(0),
  pallet_slots_used: z.number().int().default(0),
  pallet_slots_total: z.number().int().default(0),
});
export type LoadPlan = z.infer<typeof LoadPlan>;

// ---------- Visualization ----------

export const VizPallet = z.object({
  pallet_id: z.string(),
  label: z.string(),
  color: z.string(),
  position: z.record(z.string(), z.number()),
  dims: z.record(z.string(), z.number()),
  is_return: z.boolean().default(false),
  stop_ids: z.array(z.string()).default([]),
  products_summary: z.array(z.string()).default([]),
});
export type VizPallet = z.infer<typeof VizPallet>;

export const TruckVisualization = z.object({
  truck_dims: z
    .record(z.string(), z.number())
    .default({ length_cm: 620, width_cm: 240, height_cm: 240 }),
  pallet_dims: z
    .record(z.string(), z.number())
    .default({ length_cm: 120, width_cm: 80, height_cm: 15 }),
  pallets: z.array(VizPallet).default([]),
  route_geojson: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type TruckVisualization = z.infer<typeof TruckVisualization>;

// ---------- Route & Optimization ----------

export const RouteResult = z.object({
  transport_id: z.string(),
  route_code: z.string(),
  driver_id: z.string(),
  driver_name: z.string(),
  truck_type: TruckType,
  vehicle_id: z.string().nullable().optional(),
  date: z.string(),
  shift: z.union([z.literal(1), z.literal(2)]).default(1),
  ordered_stops: z.array(DeliveryStop),
  total_distance_km: z.number().default(0),
  total_time_min: z.number().default(0),
  total_stops: z.number().int().default(0),
  total_invoice_value: Decimal.default("0"),
  total_cash_to_collect: Decimal.default("0"),
  time_window_violations: z.array(z.string()).default([]),
  has_tight_windows: z.boolean().default(false),
  baseline_distance_km: z.number().nullable().optional(),
  distance_improvement_pct: z.number().nullable().optional(),
  explanation: z.string().nullable().optional(),
});
export type RouteResult = z.infer<typeof RouteResult>;

export const OptimizationResult = z.object({
  job_id: z.string(),
  transport_id: z.string(),
  status: OptimizationStatus,
  created_at: z.string(),
  completed_at: z.string().nullable().optional(),
  route: RouteResult.nullable().optional(),
  load: LoadPlan.nullable().optional(),
  viz: TruckVisualization.nullable().optional(),
  error_message: z.string().nullable().optional(),
});
export type OptimizationResult = z.infer<typeof OptimizationResult>;

// ---------- Request / Response ----------

export const OptimizeRequest = z.object({
  transport_id: z.string(),
  truck_type: TruckType.default("6pal"),
  date: z.string().nullable().optional(),
  use_real_roads: z.boolean().default(false),
  respect_time_windows: z.boolean().default(true),
  include_returnables: z.boolean().default(true),
  solver_time_limit_s: z.number().int().min(5).max(60).default(15),
});
export type OptimizeRequest = z.infer<typeof OptimizeRequest>;

export const OptimizeResponse = z.object({
  job_id: z.string(),
  status: OptimizationStatus,
  ws_url: z.string(),
});
export type OptimizeResponse = z.infer<typeof OptimizeResponse>;

export const TransportSummary = z.object({
  transport_id: z.string(),
  route_code: z.string(),
  driver_name: z.string(),
  date: z.string(),
  stop_count: z.number().int(),
  truck_type: TruckType,
});
export type TransportSummary = z.infer<typeof TransportSummary>;

export const CustomerDetail = z.object({
  customer_id: z.string(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  // Backend uses int keys for shift; JSON serializes them as strings ("1", "2").
  time_windows: z.record(z.string(), TimeWindow),
});
export type CustomerDetail = z.infer<typeof CustomerDetail>;

export const HealthResponse = z.object({
  status: z.literal("ok").default("ok"),
  data_loaded: z.boolean(),
  customer_count: z.number().int(),
  transport_count: z.number().int(),
  geocoded_count: z.number().int(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
