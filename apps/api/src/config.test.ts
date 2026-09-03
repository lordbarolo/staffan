import { describe, expect, it } from "vitest";

import { readApiConfig } from "./config.js";

describe("readApiConfig", () => {
  it("requires an explicit model gateway URL", () => {
    expect(() => readApiConfig({})).toThrow();
    expect(readApiConfig({ MODEL_GATEWAY_URL: "https://model.example.test/extract" }).MODEL_GATEWAY_URL).toBe(
      "https://model.example.test/extract",
    );
  });
});
