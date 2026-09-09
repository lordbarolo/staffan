import { describe, expect, it } from "vitest";

import { readApiConfig } from "./config.js";

const authEnvironment = {
  OPERATOR_PASSWORD_HASH:
    "scrypt:16384:8:1:AAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  OPERATOR_USERNAME: "operator",
};

describe("readApiConfig", () => {
  it("requires an explicit model gateway URL", () => {
    expect(() => readApiConfig({})).toThrow();
    expect(readApiConfig({ ...authEnvironment, MODEL_GATEWAY_URL: "https://model.example.test/extract" }).MODEL_GATEWAY_URL).toBe(
      "https://model.example.test/extract",
    );
  });

  it("requires an API key for the direct OpenAI provider", () => {
    expect(() => readApiConfig({ ...authEnvironment, MODEL_PROVIDER: "openai" })).toThrow(
      "OPENAI_API_KEY måste anges för MODEL_PROVIDER=openai",
    );
    const config = readApiConfig({
      MODEL_PROVIDER: "openai",
      MODEL_NAME: "gpt-5.4-mini-2026-03-17",
      MODEL_VERSION: "2026-03-17",
      OPENAI_API_KEY: "test-key",
      ...authEnvironment,
    });
    expect(config.MODEL_GATEWAY_URL).toBeUndefined();
    expect(config.MODEL_NAME).toBe("gpt-5.4-mini-2026-03-17");
  });

  it("requires e-Avrop credentials as a pair", () => {
    expect(() =>
      readApiConfig({
        MODEL_GATEWAY_URL: "https://model.example.test/extract",
        EAVROP_USERNAME: "operator@example.test",
        ...authEnvironment,
      }),
    ).toThrow("EAVROP_USERNAME och EAVROP_PASSWORD måste anges tillsammans");

    expect(
      readApiConfig({
        MODEL_GATEWAY_URL: "https://model.example.test/extract",
        EAVROP_USERNAME: "operator@example.test",
        EAVROP_PASSWORD: "secret",
        ...authEnvironment,
      }).EAVROP_USERNAME,
    ).toBe("operator@example.test");
  });

  it("requires a valid password hash for the local operator", () => {
    expect(() =>
      readApiConfig({
        MODEL_GATEWAY_URL: "https://model.example.test/extract",
        OPERATOR_PASSWORD_HASH: "plaintext-is-not-allowed",
        OPERATOR_USERNAME: "operator",
      }),
    ).toThrow("OPERATOR_PASSWORD_HASH måste vara en giltig scrypt-hash");
  });
});
