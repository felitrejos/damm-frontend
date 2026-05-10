// Wire -> domain adapter. Converts the backend `TruckLayout` payload into
// the `TruckVisualization` shape that the React components consume.
//
// What it does:
//   - Drops the returnable pallet (v1 ignores `is_return`).
//   - Derives a {x,y,z} position from each slot's (column, row) grid index.
//   - Fills empty grid cells with placeholder pallets so the 3D scene shows
//     the wooden base at every slot the truck could carry, not just the
//     occupied ones.
//   - Renames product fields to the UI-friendly form (material_code -> sku,
//     description -> name, quantity -> cases).
import type {
  Product,
  TruckLayout,
  TruckSlot,
  TruckVisualization,
  VizPallet,
} from "./types";

export function adaptTruckLayout(layout: TruckLayout): TruckVisualization {
  const occupied = layout.slots.filter((s) => !s.is_return);
  const occupiedKeys = new Set(occupied.map((s) => slotKey(s.column, s.row)));

  const real = occupied.map((slot) => slotToPallet(slot, layout.pallet_dims_cm));
  const empties: VizPallet[] = [];
  for (let row = 1; row <= layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      if (occupiedKeys.has(slotKey(col, row))) continue;
      empties.push(emptyPallet(col, row, layout.pallet_dims_cm));
    }
  }

  return {
    truck_dims: layout.truck_dims_cm,
    pallet_dims: layout.pallet_dims_cm,
    pallets: [...real, ...empties],
    route_geojson: null,
  };
}

function slotKey(col: number, row: number) {
  return `${col}:${row}`;
}

function gridPosition(
  col: number,
  row: number,
  palletDims: TruckLayout["pallet_dims_cm"],
) {
  return {
    x: (row - 1) * palletDims.length_cm,
    y: col * palletDims.width_cm,
    z: 0,
  };
}

function slotToPallet(
  slot: TruckSlot,
  palletDims: TruckLayout["pallet_dims_cm"],
): VizPallet {
  const products: Product[] = slot.products.map((p) => ({
    sku: p.material_code,
    name: p.description,
    cases: p.quantity,
    unit: p.unit,
  }));
  return {
    pallet_id: slot.pallet_id,
    customer_name: slot.customer_name,
    sequence: slot.sequence,
    color: slot.color,
    position: gridPosition(slot.column, slot.row, palletDims),
    dims: {
      length_cm: palletDims.length_cm,
      width_cm: palletDims.width_cm,
      height_cm: slot.loaded_height_cm,
    },
    kind: slot.kind,
    is_empty: slot.is_empty,
    is_return: slot.is_return,
    total_volume_l: slot.total_volume_l,
    total_weight_kg: slot.total_weight_kg,
    products,
  };
}

function emptyPallet(
  col: number,
  row: number,
  palletDims: TruckLayout["pallet_dims_cm"],
): VizPallet {
  return {
    pallet_id: `EMPTY-${col}-${row}`,
    customer_name: "",
    sequence: null,
    color: "#000000",
    position: gridPosition(col, row, palletDims),
    // height = base only, no stack drawn.
    dims: {
      length_cm: palletDims.length_cm,
      width_cm: palletDims.width_cm,
      height_cm: palletDims.height_cm,
    },
    kind: "case-bottle",
    is_empty: true,
    is_return: false,
    total_volume_l: 0,
    total_weight_kg: 0,
    products: [],
  };
}
