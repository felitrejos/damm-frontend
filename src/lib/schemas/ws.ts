import { z } from "zod";
import { OptimizationResult, RouteResult } from "./domain";

// Exact phase keys emitted by the backend. Frontend may render friendlier labels.
export const WsProgressPhase = z.enum([
  "geocoding",
  "distance_matrix",
  "vrp_solving",
  "pallet_packing",
  "pick_list",
  "visualization",
  "explanation",
  "done",
]);
export type WsProgressPhase = z.infer<typeof WsProgressPhase>;

export const WsProgress = z.object({
  type: z.literal("progress"),
  job_id: z.string(),
  // Permissive: backend emits the keys above, but we don't reject unknowns at parse time.
  phase: z.string(),
  pct: z.number().int(),
  message: z.string(),
  timestamp: z.string(),
});
export type WsProgress = z.infer<typeof WsProgress>;

export const WsPartialResult = z.object({
  type: z.literal("partial"),
  job_id: z.string(),
  route: RouteResult,
  timestamp: z.string(),
});
export type WsPartialResult = z.infer<typeof WsPartialResult>;

export const WsResult = z.object({
  type: z.literal("result"),
  job_id: z.string(),
  result: OptimizationResult,
  timestamp: z.string(),
});
export type WsResult = z.infer<typeof WsResult>;

export const WsDone = z.object({
  type: z.literal("done"),
  job_id: z.string(),
  timestamp: z.string(),
});
export type WsDone = z.infer<typeof WsDone>;

export const WsError = z.object({
  type: z.literal("error"),
  job_id: z.string(),
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
});
export type WsError = z.infer<typeof WsError>;

export const WsMessage = z.discriminatedUnion("type", [
  WsProgress,
  WsPartialResult,
  WsResult,
  WsDone,
  WsError,
]);
export type WsMessage = z.infer<typeof WsMessage>;
