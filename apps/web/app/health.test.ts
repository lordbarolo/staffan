import { afterEach, describe, expect, it, vi } from "vitest";

import { getHealth } from "./health";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getHealth", () => {
  it("accepts the expected API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: "ok", database: "ok" }), { status: 200 }),
      ),
    );

    await expect(getHealth()).resolves.toEqual({ available: true, database: "ok" });
  });

  it("shows an explicit error for malformed API data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "maybe" }), { status: 200 })),
    );

    await expect(getHealth()).resolves.toEqual({
      available: false,
      message: "API returnerade ett oväntat svar",
    });
  });
});
