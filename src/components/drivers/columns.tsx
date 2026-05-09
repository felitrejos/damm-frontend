import { z } from "zod";

// Drivers — not yet a first-class model in damm-backend. TransportSummary carries
// `driver_name: str` and TransportDetail carries `driver_id: str`. We're modeling
// Driver as a first-class entity here; see wiki/decisions for the proposal.
export const driverSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable().optional(),
});

export type Driver = z.infer<typeof driverSchema>;
