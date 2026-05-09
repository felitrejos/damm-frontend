import { z } from "zod";

// Mirrors damm-backend CustomerRead (catalog.py): code, name, address, city,
// postal_code, payment_condition, lat, lng. The `zone` field is a frontend
// addition for the Add Route picker; see wiki/decisions for the proposal.
export const clientSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  zone: z.string(), // frontend-only for now; will be backend-derived later
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});

export type Client = z.infer<typeof clientSchema>;
