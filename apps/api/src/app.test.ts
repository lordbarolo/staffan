import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallOffApproval, RawArtifact } from "@staffan/core";
import type { ExtractionRecord } from "@staffan/ingress";

import { expectedKarlstadExtraction, karlstadRawText } from "../../../packages/ingress/test-fixtures/karlstad-calloff.js";

import { buildApp, type CallOffApiRepository } from "./app.js";

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

describe("CallOff intake API", () => {
  it("imports, reviews, corrects and approves a CallOff", async () => {
    const artifacts = new Map<string, RawArtifact>();
    const extractions = new Map<string, ExtractionRecord>();
    let approved: CallOffApproval | null = null;
    const repository: CallOffApiRepository = {
      async saveArtifact(artifact) {
        artifacts.set(artifact.id, artifact);
      },
      async saveExtraction(extraction) {
        extractions.set(extraction.id, extraction);
      },
      async listReviews() {
        return [];
      },
      async getReview(id) {
        const extraction = extractions.get(id);
        if (extraction === undefined) return null;
        const artifact = artifacts.get(extraction.artifactId);
        return artifact === undefined ? null : { artifact, extraction };
      },
      async approve(_id, fields) {
        approved = fields;
        return { status: "approved", fields };
      },
    };
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository,
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        async extractCallOff(input) {
          return expectedKarlstadExtraction(input.artifactId);
        },
      },
    });
    openApps.push(app);

    const imported = await app.inject({
      method: "POST",
      url: "/call-offs/import-text",
      payload: { content: karlstadRawText, sourceSystem: "pdf-upload" },
    });
    expect(imported.statusCode).toBe(201);
    const extractionId = imported.json().extraction.id as string;

    const reviewed = await app.inject({ method: "GET", url: `/call-offs/reviews/${extractionId}` });
    expect(reviewed.statusCode).toBe(200);
    const extraction = reviewed.json().extraction.extraction as Record<string, unknown>;
    extraction.location = "Korrigerad placering";

    const response = await app.inject({
      method: "POST",
      url: `/call-offs/reviews/${extractionId}/approve`,
      payload: extraction,
    });
    expect(response.statusCode).toBe(200);
    expect(approved).toMatchObject({ location: "Korrigerad placering", externalRef: null });
  });

  it("returns explicit validation errors instead of approving incomplete data", async () => {
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository: {
        saveArtifact: vi.fn(),
        saveExtraction: vi.fn(),
        listReviews: vi.fn().mockResolvedValue([]),
        getReview: vi.fn().mockResolvedValue(null),
        approve: vi.fn(),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/call-offs/reviews/00000000-0000-4000-8000-000000000001/approve",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "Ogiltig indata" });
  });

  it("returns 503 when the database is unavailable during intake", async () => {
    const app = buildApp(vi.fn().mockRejectedValue(new Error("offline")), {
      repository: {
        saveArtifact: vi.fn().mockRejectedValue(new Error("offline")),
        saveExtraction: vi.fn(),
        listReviews: vi.fn().mockRejectedValue(new Error("offline")),
        getReview: vi.fn().mockRejectedValue(new Error("offline")),
        approve: vi.fn().mockRejectedValue(new Error("offline")),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    });
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/call-offs/import-text",
      payload: { content: "Ett avrop", sourceSystem: "manual" },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "Databasen är inte tillgänglig" });
  });
});
