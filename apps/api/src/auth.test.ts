import type { AuthRepository, OperatorWithPassword } from "@staffan/db";
import { describe, expect, it } from "vitest";

import { createAuthService, hashPassword, isPasswordHash, verifyPassword } from "./auth.js";

class MemoryAuthRepository implements AuthRepository {
  operator: OperatorWithPassword | null = null;
  sessions = new Map<string, { expiresAt: Date; operatorId: string }>();

  async ensureOperator(input: { passwordHash: string; username: string }) {
    this.operator = { active: true, id: "operator-1", ...input };
    return { id: this.operator.id, username: this.operator.username };
  }
  async findOperator(username: string) {
    return this.operator?.username === username ? this.operator : null;
  }
  async createSession(input: { expiresAt: Date; operatorId: string; tokenHash: string }) {
    this.sessions.set(input.tokenHash, input);
  }
  async findSession(tokenHash: string, now = new Date()) {
    const session = this.sessions.get(tokenHash);
    if (session === undefined || session.expiresAt <= now || this.operator === null) return null;
    return { id: this.operator.id, username: this.operator.username };
  }
  async revokeSession(tokenHash: string) {
    this.sessions.delete(tokenHash);
  }
  async close() {}
}

describe("operator authentication", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const hash = await hashPassword("ett-langt-testlosenord");

    expect(isPasswordHash(hash)).toBe(true);
    expect(hash).not.toContain("ett-langt-testlosenord");
    expect(await verifyPassword("ett-langt-testlosenord", hash)).toBe(true);
    expect(await verifyPassword("fel-losenord", hash)).toBe(false);
  });

  it("creates an opaque server-side session and revokes it", async () => {
    const repository = new MemoryAuthRepository();
    await repository.ensureOperator({
      passwordHash: await hashPassword("ett-langt-testlosenord"),
      username: "operator",
    });
    const service = createAuthService(repository, { sessionTtlHours: 12 });

    const session = await service.login("operator", "ett-langt-testlosenord");
    expect(session?.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(repository.sessions.keys().next().value).not.toBe(session?.token);
    expect(await service.verify(session?.token ?? "")).toEqual({
      id: "operator-1",
      username: "operator",
    });

    await service.logout(session?.token ?? "");
    expect(await service.verify(session?.token ?? "")).toBeNull();
  });
});
