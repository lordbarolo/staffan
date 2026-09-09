import { z } from "zod";

const workerConfigSchema = z
  .object({
    EAVROP_BROWSER_EXECUTABLE_PATH: z.string().min(1).optional(),
    EAVROP_PASSWORD: z.string().min(1),
    EAVROP_POLL_CRON: z.string().min(1).default("*/5 * * * *"),
    EAVROP_POLL_TIME_ZONE: z.string().min(1).default("Europe/Stockholm"),
    EAVROP_POLL_URL: z.url().max(2_000),
    EAVROP_USERNAME: z.string().min(1),
    MODEL_GATEWAY_TOKEN: z.string().min(1).optional(),
    MODEL_GATEWAY_URL: z.url().optional(),
    MODEL_NAME: z.string().min(1).default("calloff-extractor"),
    MODEL_PROVIDER: z.enum(["http", "openai"]).default("http"),
    MODEL_VERSION: z.string().min(1).default("1"),
    OCR_TESSERACT_PATH: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    WORKER_IMPORT_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  })
  .superRefine((value, context) => {
    if (value.MODEL_PROVIDER === "http" && value.MODEL_GATEWAY_URL === undefined) {
      context.addIssue({
        code: "custom",
        message: "MODEL_GATEWAY_URL måste anges för MODEL_PROVIDER=http",
        path: ["MODEL_GATEWAY_URL"],
      });
    }
    if (value.MODEL_PROVIDER === "openai" && value.OPENAI_API_KEY === undefined) {
      context.addIssue({
        code: "custom",
        message: "OPENAI_API_KEY måste anges för MODEL_PROVIDER=openai",
        path: ["OPENAI_API_KEY"],
      });
    }
  });

export function readWorkerConfig(environment: NodeJS.ProcessEnv = process.env) {
  return workerConfigSchema.parse(environment);
}
