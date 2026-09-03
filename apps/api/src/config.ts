import { z } from "zod";

const apiConfigSchema = z.object({
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  MODEL_GATEWAY_URL: z.url(),
  MODEL_GATEWAY_TOKEN: z.string().min(1).optional(),
  MODEL_NAME: z.string().min(1).default("calloff-extractor"),
  MODEL_VERSION: z.string().min(1).default("1"),
});

export function readApiConfig(environment: NodeJS.ProcessEnv = process.env) {
  return apiConfigSchema.parse(environment);
}
