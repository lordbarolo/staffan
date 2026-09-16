import { afterEach, describe, expect, it, vi } from "vitest";
import type { CallOffApproval, RawArtifact } from "@staffan/core";
import type { ExtractionRecord } from "@staffan/ingress";
import type { InjectOptions } from "fastify";
import { ApprovalConflictError } from "@staffan/db";

import { expectedKarlstadExtraction, karlstadRawText } from "../../../packages/ingress/test-fixtures/karlstad-calloff.js";

import { buildApp, type CallOffApiRepository } from "./app.js";
import type { AuthService } from "./auth.js";

const sessionToken = "a".repeat(43);
const operator = { id: "operator-1", username: "operator" };
const authService: AuthService = {
  async login(username, password) {
    return username === "operator" && password === "test-password"
      ? { expiresAt: "2027-01-01T12:00:00.000Z", operator, token: sessionToken }
      : null;
  },
  logout: vi.fn(),
  async verify(token) {
    return token === sessionToken ? operator : null;
  },
};
const auth = { cookieSecure: false, service: authService };

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

describe("operator authentication", () => {
  it("keeps health public and protects every business route", async () => {
    const app = buildApp(vi.fn().mockResolvedValue(undefined), undefined, auth);
    openApps.push(app);

    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/call-offs/reviews" })).statusCode).toBe(401);
  });

  it("creates an HttpOnly SameSite session cookie after login", async () => {
    const app = buildApp(vi.fn().mockResolvedValue(undefined), undefined, auth);
    openApps.push(app);

    const response = await app.inject({
      method: "POST",
      payload: { password: "test-password", username: "operator" },
      url: "/auth/login",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["set-cookie"]).toContain("HttpOnly");
    expect(response.headers["set-cookie"]).toContain("SameSite=Strict");
    expect(response.headers["set-cookie"]).not.toContain("Secure");
  });
});

describe("CallOff intake API", () => {
  it("imports an e-Avrop link through the existing review pipeline", async () => {
    const artifacts: RawArtifact[] = [];
    const repository: CallOffApiRepository = {
      async saveArtifact(artifact) {
        artifacts.push(artifact);
      },
      saveExtraction: vi.fn(),
      listReviews: vi.fn().mockResolvedValue([]),
      getReview: vi.fn().mockResolvedValue(null),
      getOriginalArtifact: vi.fn().mockResolvedValue(null),
      approve: vi.fn(),
    };
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository,
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        async extractCallOff(input) {
          return expectedKarlstadExtraction(input.artifactId);
        },
      },
      eavrop: {
        async fetchCallOff(sourceUrl) {
          return {
            sourceUrl,
            externalRef: "AV-42",
            pageText: "Avrop om sjuksköterska i Karlstad",
            attachmentStatuses: [
              { detail: "Bilagan hämtades", fileName: "schema.txt", status: "downloaded" },
            ],
            attachments: [
              {
                sourceUrl: "https://www.e-avrop.com/files/schema.txt",
                fileName: "schema.txt",
                mediaType: "text/plain",
                content: new TextEncoder().encode("Schema: dag och kväll"),
              },
            ],
            log: [
              { step: "navigate", status: "ok", detail: "Avropslänken öppnades" },
            ],
          };
        },
      },
    }, auth);
    openApps.push(app);

    const response = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-eavrop",
      payload: { url: "https://www.e-avrop.com/notice.aspx?id=42" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().portal).toMatchObject({ attachmentCount: 1 });
    expect(artifacts[0]).toMatchObject({
      externalRef: "AV-42",
      sourceSystem: "e-avrop",
      sourceType: "raw_text",
    });
    expect(artifacts[0]?.content).toContain("Schema: dag och kväll");
  });

  it("reports a disabled e-Avrop adapter explicitly", async () => {
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository: {
        saveArtifact: vi.fn(),
        saveExtraction: vi.fn(),
        listReviews: vi.fn().mockResolvedValue([]),
        getReview: vi.fn().mockResolvedValue(null),
        getOriginalArtifact: vi.fn().mockResolvedValue(null),
        approve: vi.fn(),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    }, auth);
    openApps.push(app);

    const response = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-eavrop",
      payload: { url: "https://www.e-avrop.com/notice.aspx?id=42" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "e-Avrop-integrationen är inte konfigurerad" });
  });

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
        return artifact === undefined ? null : {
          artifact: { ...artifact, originalAvailable: false },
          extraction,
        };
      },
      getOriginalArtifact: vi.fn().mockResolvedValue(null),
      async approve(_id, fields, approvedByOperatorId) {
        expect(approvedByOperatorId).toBe(operator.id);
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
    }, auth);
    openApps.push(app);

    const imported = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-text",
      payload: { content: karlstadRawText, sourceSystem: "pdf-upload" },
    });
    expect(imported.statusCode).toBe(201);
    const extractionId = imported.json().extraction.id as string;

    const reviewed = await authenticatedInject(app, { method: "GET", url: `/call-offs/reviews/${extractionId}` });
    expect(reviewed.statusCode).toBe(200);
    const extraction = reviewed.json().extraction.extraction as Record<string, unknown>;
    extraction.location = "Korrigerad placering";

    const response = await authenticatedInject(app, {
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
        getOriginalArtifact: vi.fn().mockResolvedValue(null),
        approve: vi.fn(),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    }, auth);
    openApps.push(app);

    const response = await authenticatedInject(app, {
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
        getOriginalArtifact: vi.fn().mockRejectedValue(new Error("offline")),
        approve: vi.fn().mockRejectedValue(new Error("offline")),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    }, auth);
    openApps.push(app);

    const response = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-text",
      payload: { content: "Ett avrop", sourceSystem: "manual" },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "Databasen är inte tillgänglig" });
  });

  it("registers, deduplicates and queues an e-Avrop link found in incoming mail", async () => {
    const discovery = {
      attemptCount: 0,
      createdAt: "2026-09-16T08:00:00.000Z",
      externalRef: "AV-EMAIL-1",
      extractionId: null,
      id: "discovery-email-1",
      lastError: null,
      leaseExpiresAt: null,
      sourceKey: "ref:AV-EMAIL-1",
      sourceSystem: "e-avrop",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-1",
      status: "discovered" as const,
      updatedAt: "2026-09-16T08:00:00.000Z",
    };
    let registeredStatus: "discovered" | "queued" = "discovered";
    const register = vi.fn().mockImplementation(async () => ({
      ...discovery,
      status: registeredStatus,
    }));
    const markQueued = vi.fn().mockImplementation(async () => {
      registeredStatus = "queued";
      return true;
    });
    const enqueue = vi.fn()
      .mockResolvedValueOnce("job-email-1")
      .mockResolvedValueOnce(null);
    const repository: CallOffApiRepository = {
      saveArtifact: vi.fn(),
      saveExtraction: vi.fn(),
      listReviews: vi.fn().mockResolvedValue([]),
      getReview: vi.fn().mockResolvedValue(null),
      getOriginalArtifact: vi.fn().mockResolvedValue(null),
      approve: vi.fn(),
    };
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository,
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
      discoveryRepository: {
        list: vi.fn().mockResolvedValue([]),
        markQueued,
        register,
      },
    }, auth, { queue: { enqueue } });
    openApps.push(app);

    const first = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-eavrop-email",
      payload: {
        rawEmail: "Avrop: https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-1",
      },
    });
    const duplicate = await authenticatedInject(app, {
      method: "POST",
      url: "/call-offs/import-eavrop-email",
      payload: {
        rawEmail: "Samma avrop: https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-1",
      },
    });

    expect(first.statusCode).toBe(202);
    expect(first.json()).toMatchObject({
      discovery: { id: discovery.id, sourceSystem: "e-avrop", status: "queued" },
      queued: true,
    });
    expect(duplicate.statusCode).toBe(202);
    expect(duplicate.json()).toMatchObject({
      discovery: { id: discovery.id, status: "queued" },
      queued: false,
    });
    expect(register).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(markQueued).toHaveBeenCalledTimes(2);
  });

  it("accepts raw RFC 822 mail with the mailbox token and exposes unsupported mail", async () => {
    const token = "mailbox-test-token-that-is-at-least-32-characters";
    const register = vi.fn().mockResolvedValue({
      attemptCount: 0,
      createdAt: "2026-09-16T08:00:00.000Z",
      externalRef: "AV-EMAIL-2",
      extractionId: null,
      id: "discovery-email-2",
      lastError: null,
      leaseExpiresAt: null,
      sourceKey: "ref:AV-EMAIL-2",
      sourceSystem: "e-avrop",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-2",
      status: "discovered",
      updatedAt: "2026-09-16T08:00:00.000Z",
    });
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository: {
        saveArtifact: vi.fn(),
        saveExtraction: vi.fn(),
        listReviews: vi.fn().mockResolvedValue([]),
        getReview: vi.fn().mockResolvedValue(null),
        getOriginalArtifact: vi.fn().mockResolvedValue(null),
        approve: vi.fn(),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
      discoveryRepository: {
        list: vi.fn().mockResolvedValue([]),
        markQueued: vi.fn().mockResolvedValue(true),
        register,
      },
    }, auth, {
      queue: { enqueue: vi.fn().mockResolvedValue("job-email-2") },
      token,
    });
    openApps.push(app);

    const accepted = await app.inject({
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "message/rfc822",
      },
      payload: [
        "From: sender@example.invalid",
        "Subject: Nytt avrop",
        "",
        "https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-2",
      ].join("\r\n"),
      url: "/call-offs/import-eavrop-email",
    });
    const unsupported = await app.inject({
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "message/rfc822",
      },
      payload: "Subject: Manuell kontroll\r\n\r\nhttps://example.invalid/notice?id=1",
      url: "/call-offs/import-eavrop-email",
    });

    expect(accepted.statusCode).toBe(202);
    expect(register).toHaveBeenCalledWith({
      externalRef: "AV-EMAIL-2",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-EMAIL-2",
    });
    expect(unsupported.statusCode).toBe(422);
    expect(unsupported.json().error).toContain("manuell kontroll krävs");
  });

  it("serves a preserved PDF original only through the authenticated review route", async () => {
    const content = new TextEncoder().encode("%PDF-1.7 synthetic original");
    const repository: CallOffApiRepository = {
      saveArtifact: vi.fn(),
      saveExtraction: vi.fn(),
      listReviews: vi.fn().mockResolvedValue([]),
      getReview: vi.fn().mockResolvedValue(null),
      getOriginalArtifact: vi.fn().mockResolvedValue({
        content,
        fileName: "underlag.pdf",
        mediaType: "application/pdf",
        sha256: "a".repeat(64),
      }),
      approve: vi.fn(),
    };
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository,
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    }, auth);
    openApps.push(app);
    const url = "/call-offs/reviews/00000000-0000-4000-8000-000000000001/original";

    expect((await app.inject({ method: "GET", url })).statusCode).toBe(401);
    const response = await authenticatedInject(app, { method: "GET", url });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.rawPayload).toEqual(Buffer.from(content));
  });

  it("returns conflict when an approval idempotency key is reused differently", async () => {
    const app = buildApp(vi.fn().mockResolvedValue(undefined), {
      repository: {
        saveArtifact: vi.fn(),
        saveExtraction: vi.fn(),
        listReviews: vi.fn().mockResolvedValue([]),
        getReview: vi.fn().mockResolvedValue(null),
        getOriginalArtifact: vi.fn().mockResolvedValue(null),
        approve: vi.fn().mockRejectedValue(new ApprovalConflictError()),
      },
      gateway: {
        identity: { provider: "fixture", name: "generic", version: "1" },
        extractCallOff: vi.fn(),
      },
    }, auth);
    openApps.push(app);

    const response = await authenticatedInject(app, {
      method: "POST",
      payload: expectedKarlstadExtraction("00000000-0000-4000-8000-000000000002"),
      url: "/call-offs/reviews/00000000-0000-4000-8000-000000000001/approve",
    });

    expect(response.statusCode).toBe(409);
  });
});

function authenticatedInject(
  app: ReturnType<typeof buildApp>,
  options: InjectOptions,
) {
  return app.inject({
    ...options,
    headers: { ...options.headers, cookie: `staffan_session=${sessionToken}` },
  });
}
