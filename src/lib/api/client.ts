import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type FetchJsonInit = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit;
  headers?: Record<string, string>;
};

export async function fetchJson<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  init: FetchJsonInit = {},
): Promise<z.infer<TSchema>> {
  const { headers, ...rest } = init;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Backend request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  return schema.parse(payload);
}
