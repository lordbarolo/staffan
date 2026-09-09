import { describe, expect, it } from "vitest";

import { readWorkerConfig } from "./config.js";

const base = {
  EAVROP_PASSWORD: "secret",
  EAVROP_POLL_URL: "https://www.e-avrop.com/dashboard.aspx",
  EAVROP_USERNAME: "operator@example.test",
  MODEL_GATEWAY_URL: "https://model.example.test/extract",
};

describe("readWorkerConfig", () => {
  it("requires credentials, a polling URL and an explicit model provider endpoint", () => {
    expect(() => readWorkerConfig({})).toThrow();
    expect(readWorkerConfig(base)).toMatchObject({
      EAVROP_POLL_CRON: "*/5 * * * *",
      EAVROP_POLL_TIME_ZONE: "Europe/Stockholm",
      WORKER_IMPORT_MAX_ATTEMPTS: 5,
    });
  });

  it("supports the direct OpenAI provider without a generic gateway URL", () => {
    const config = readWorkerConfig({
      EAVROP_PASSWORD: "secret",
      EAVROP_POLL_URL: "https://www.e-avrop.com/dashboard.aspx",
      EAVROP_USERNAME: "operator@example.test",
      MODEL_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
    });

    expect(config.MODEL_GATEWAY_URL).toBeUndefined();
    expect(config.MODEL_PROVIDER).toBe("openai");
  });
});
