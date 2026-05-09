import { z } from "zod";

// Mirrors damm-backend TruckRead (catalog.py): code, plate, truck_type,
// capacity_pallets, warehouse_id, active.
export const truckTypeSchema = z.enum(["6pal", "8pal", "van"]);
export type TruckType = z.infer<typeof truckTypeSchema>;

export const truckSchema = z.object({
  id: z.number(),
  code: z.string(),
  plate: z.string().nullable(),
  truck_type: truckTypeSchema,
  capacity_pallets: z.number(),
  warehouse_id: z.number().nullable().optional(),
  active: z.boolean().default(true),
});

export type Truck = z.infer<typeof truckSchema>;
