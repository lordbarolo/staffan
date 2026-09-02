import { z } from "zod";

const healthResponseSchema = z.object({
  database: z.literal("ok"),
  status: z.literal("ok"),
});

export type HealthState =
  | { available: true; database: "ok" }
  | { available: false; message: string };

export async function getHealth(): Promise<HealthState> {
  const apiUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";

  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return { available: false, message: `API svarade med HTTP ${response.status}` };
    }

    const health = healthResponseSchema.safeParse(await response.json());
    if (!health.success) {
      return { available: false, message: "API returnerade ett oväntat svar" };
    }

    return { available: true, database: health.data.database };
  } catch {
    return { available: false, message: "API kan inte nås" };
  }
}
