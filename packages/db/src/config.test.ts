import { describe, expect, it } from "vitest";

import { readDatabaseUrl } from "./config.js";

describe("readDatabaseUrl", () => {
  it("accepts PostgreSQL connection URLs", () => {
    expect(readDatabaseUrl({ DATABASE_URL: "postgres://user:pass@localhost:5432/app" })).toBe(
      "postgres://user:pass@localhost:5432/app",
    );
  });

  it("rejects missing configuration", () => {
    expect(() => readDatabaseUrl({})).toThrow();
  });
});
