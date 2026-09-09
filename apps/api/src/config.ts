import { z } from "zod";

import { isPasswordHash } from "./auth.js";

const apiConfigSchema = z.object({
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  EAVROP_BROWSER_EXECUTABLE_PATH: z.string().min(1).optional(),
  EAVROP_PASSWORD: z.string().min(1).optional(),
  EAVROP_USERNAME: z.string().min(1).optional(),
  MODEL_PROVIDER: z.enum(["http", "openai"]).default("http"),
  MODEL_GATEWAY_URL: z.url().optional(),
  MODEL_GATEWAY_TOKEN: z.string().min(1).optional(),
  MODEL_NAME: z.string().min(1).default("calloff-extractor"),
  MODEL_VERSION: z.string().min(1).default("1"),
  OCR_TESSERACT_PATH: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPERATOR_PASSWORD_HASH: z.string().refine(isPasswordHash, "OPERATOR_PASSWORD_HASH måste vara en giltig scrypt-hash"),
  OPERATOR_USERNAME: z.string().trim().min(1).max(100),
}).superRefine((value, context) => {
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
  if ((value.EAVROP_USERNAME === undefined) !== (value.EAVROP_PASSWORD === undefined)) {
    context.addIssue({
      code: "custom",
      message: "EAVROP_USERNAME och EAVROP_PASSWORD måste anges tillsammans",
      path: ["EAVROP_USERNAME"],
    });
  }
});

export function readApiConfig(environment: NodeJS.ProcessEnv = process.env) {
  return apiConfigSchema.parse(environment);
}
