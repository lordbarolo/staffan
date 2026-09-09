import {
  discoveryKey,
  type IngressDiscoveryRecord,
  type IngressDiscoveryRepository,
} from "@staffan/db";
import type { RawArtifact } from "@staffan/core";
import type {
  CallOffReviewRepository,
  EavropDiscoveredCallOff,
  ExtractionRecord,
} from "@staffan/ingress";
import { describe, expect, it, vi } from "vitest";

import { expectedScannedCallOffExtraction } from "../../../packages/ingress/test-fixtures/scanned-calloff.js";
import { importEavropDiscovery, pollEavrop } from "./jobs.js";

class MemoryDiscoveryRepository implements IngressDiscoveryRepository {
  readonly records = new Map<string, IngressDiscoveryRecord>();

  async register(discovery: EavropDiscoveredCallOff) {
    const sourceKey = discoveryKey(discovery);
    const existing = [...this.records.values()].find((record) => record.sourceKey === sourceKey);
    if (existing !== undefined) return existing;
    const now = "2027-01-01T00:00:00.000Z";
    const record: IngressDiscoveryRecord = {
      attemptCount: 0,
      createdAt: now,
      externalRef: discovery.externalRef,
      extractionId: null,
      id: `discovery-${this.records.size + 1}`,
      lastError: null,
      leaseExpiresAt: null,
      sourceKey,
      sourceSystem: "e-avrop",
      sourceUrl: discovery.sourceUrl,
      status: "discovered",
      updatedAt: now,
    };
    this.records.set(record.id, record);
    return record;
  }

  async listPending() {
    return [...this.records.values()].filter((record) =>
      ["discovered", "queued"].includes(record.status),
    );
  }

  async list() {
    return [...this.records.values()];
  }

  async get(id: string) {
    return this.records.get(id) ?? null;
  }

  async markQueued(id: string) {
    this.update(id, { status: "queued" });
  }

  async claim(id: string) {
    const record = this.records.get(id);
    if (record === undefined || !["discovered", "queued"].includes(record.status)) {
      return null;
    }
    return this.update(id, {
      attemptCount: record.attemptCount + 1,
      leaseExpiresAt: "2027-01-01T00:15:00.000Z",
      status: "processing",
    });
  }

  async markRetry(id: string, error: string) {
    this.update(id, { lastError: error, leaseExpiresAt: null, status: "queued" });
  }

  async markFailed(id: string, error: string) {
    this.update(id, { lastError: error, leaseExpiresAt: null, status: "failed" });
  }

  async markInReview(id: string, extractionId: string) {
    this.update(id, {
      extractionId,
      lastError: null,
      leaseExpiresAt: null,
      status: "in_review",
    });
  }

  async close() {}

  private update(id: string, patch: Partial<IngressDiscoveryRecord>) {
    const record = this.records.get(id);
    if (record === undefined) throw new Error("Okänd discovery");
    const updated = { ...record, ...patch };
    this.records.set(id, updated);
    return updated;
  }
}

function callOffRepository() {
  const artifacts: RawArtifact[] = [];
  const extractions: ExtractionRecord[] = [];
  const repository: CallOffReviewRepository = {
    async saveArtifact(artifact) {
      artifacts.push(artifact);
    },
    async saveExtraction(extraction) {
      extractions.push(extraction);
    },
  };
  return { artifacts, extractions, repository };
}

describe("e-Avrop background jobs", () => {
  it("registers portal discoveries and enqueues only pending imports", async () => {
    const discoveryRepository = new MemoryDiscoveryRepository();
    const enqueue = vi.fn().mockResolvedValue("job-1");
    const result = await pollEavrop({
      discoveryRepository,
      pollUrl: "https://www.e-avrop.com/dashboard.aspx",
      portal: {
        fetchCallOff: vi.fn(),
        discoverCallOffs: vi.fn().mockResolvedValue({
          callOffs: [
            {
              externalRef: "AV-101",
              sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-101",
            },
          ],
          log: [],
        }),
      },
      queue: { enqueue },
    });

    expect(result).toEqual({ discovered: 1, queued: 1 });
    expect(enqueue).toHaveBeenCalledOnce();
    expect((await discoveryRepository.list())[0]?.status).toBe("queued");
  });

  it("imports a queued discovery through the canonical review pipeline", async () => {
    const discoveryRepository = new MemoryDiscoveryRepository();
    const discovery = await discoveryRepository.register({
      externalRef: "AV-102",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-102",
    });
    await discoveryRepository.markQueued(discovery.id);
    const callOffs = callOffRepository();

    const result = await importEavropDiscovery({
      callOffRepository: callOffs.repository,
      discoveryId: discovery.id,
      discoveryRepository,
      gateway: {
        identity: { provider: "fixture", name: "synthetic", version: "1" },
        async extractCallOff(input) {
          return expectedScannedCallOffExtraction(input.artifactId);
        },
      },
      maxAttempts: 3,
      portal: {
        discoverCallOffs: vi.fn(),
        fetchCallOff: vi.fn().mockResolvedValue({
          attachments: [],
          externalRef: "AV-102",
          log: [],
          pageText: "Syntetiskt avrop med fullständigt underlag för manuell granskning.",
          sourceUrl: discovery.sourceUrl,
        }),
      },
    });

    expect(result.status).toBe("in_review");
    expect(callOffs.artifacts).toHaveLength(1);
    expect(callOffs.extractions).toHaveLength(1);
    expect((await discoveryRepository.get(discovery.id))?.status).toBe("in_review");
  });

  it("does not claim the same active discovery twice", async () => {
    const discoveryRepository = new MemoryDiscoveryRepository();
    const discovery = await discoveryRepository.register({
      externalRef: "AV-104",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-104",
    });
    await discoveryRepository.markQueued(discovery.id);

    expect(await discoveryRepository.claim(discovery.id)).not.toBeNull();
    expect(await discoveryRepository.claim(discovery.id)).toBeNull();
  });

  it("retries transient portal errors and stops in the exception state", async () => {
    const discoveryRepository = new MemoryDiscoveryRepository();
    const discovery = await discoveryRepository.register({
      externalRef: "AV-103",
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-103",
    });
    await discoveryRepository.markQueued(discovery.id);
    const portal = {
      discoverCallOffs: vi.fn(),
      fetchCallOff: vi.fn().mockRejectedValue(new Error("Tillfälligt portalfel")),
    };
    const common = {
      callOffRepository: callOffRepository().repository,
      discoveryId: discovery.id,
      discoveryRepository,
      gateway: {
        identity: { provider: "fixture", name: "synthetic", version: "1" },
        extractCallOff: vi.fn(),
      },
      maxAttempts: 2,
      portal,
    };

    await expect(importEavropDiscovery(common)).rejects.toThrow("Tillfälligt portalfel");
    expect((await discoveryRepository.get(discovery.id))?.status).toBe("queued");
    expect((await importEavropDiscovery(common)).status).toBe("failed");
    expect((await discoveryRepository.get(discovery.id))?.status).toBe("failed");
  });
});
