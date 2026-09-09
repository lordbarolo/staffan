import { randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";

import { createDatabaseClient } from "./client.js";
import { operatorSessions, operators } from "./schema.js";

export interface OperatorIdentity {
  id: string;
  username: string;
}

export interface OperatorWithPassword extends OperatorIdentity {
  active: boolean;
  passwordHash: string;
}

export interface AuthRepository {
  close(): Promise<void>;
  createSession(input: {
    expiresAt: Date;
    operatorId: string;
    tokenHash: string;
  }): Promise<void>;
  ensureOperator(input: { passwordHash: string; username: string }): Promise<OperatorIdentity>;
  findOperator(username: string): Promise<OperatorWithPassword | null>;
  findSession(tokenHash: string, now?: Date): Promise<OperatorIdentity | null>;
  revokeSession(tokenHash: string): Promise<void>;
}

export function createPostgresAuthRepository(databaseUrl: string): AuthRepository {
  const { client, db } = createDatabaseClient(databaseUrl);

  return {
    async ensureOperator(input) {
      const now = new Date();
      const rows = await db
        .insert(operators)
        .values({
          active: true,
          createdAt: now,
          id: randomUUID(),
          passwordHash: input.passwordHash,
          updatedAt: now,
          username: normalizeUsername(input.username),
        })
        .onConflictDoUpdate({
          target: operators.username,
          set: { active: true, passwordHash: input.passwordHash, updatedAt: now },
        })
        .returning({ id: operators.id, username: operators.username });
      if (rows[0] === undefined) throw new Error("Operatören kunde inte konfigureras");
      return rows[0];
    },
    async findOperator(username) {
      const rows = await db
        .select()
        .from(operators)
        .where(eq(operators.username, normalizeUsername(username)))
        .limit(1);
      const operator = rows[0];
      return operator === undefined
        ? null
        : {
            active: operator.active,
            id: operator.id,
            passwordHash: operator.passwordHash,
            username: operator.username,
          };
    },
    async createSession(input) {
      await db.insert(operatorSessions).values({
        createdAt: new Date(),
        expiresAt: input.expiresAt,
        operatorId: input.operatorId,
        tokenHash: input.tokenHash,
      });
    },
    async findSession(tokenHash, now = new Date()) {
      const rows = await db
        .select({ id: operators.id, username: operators.username })
        .from(operatorSessions)
        .innerJoin(operators, eq(operatorSessions.operatorId, operators.id))
        .where(
          and(
            eq(operatorSessions.tokenHash, tokenHash),
            gt(operatorSessions.expiresAt, now),
            eq(operators.active, true),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },
    async revokeSession(tokenHash) {
      await db.delete(operatorSessions).where(eq(operatorSessions.tokenHash, tokenHash));
    },
    async close() {
      await client.end();
    },
  };
}

export function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("sv-SE");
}
