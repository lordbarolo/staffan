import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "./app.js";

const openApps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe("GET /health", () => {
  it("reports a healthy API and database", async () => {
    const databaseCheck = vi.fn().mockResolvedValue(undefined);
    const app = buildApp(databaseCheck);
    openApps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
    expect(databaseCheck).toHaveBeenCalledOnce();
  });

  it("makes database failure explicit", async () => {
    const app = buildApp(vi.fn().mockRejectedValue(new Error("offline")));
    openApps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "error",
      database: "unavailable",
    });
  });
});
