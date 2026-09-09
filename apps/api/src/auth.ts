import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import type { AuthRepository, OperatorIdentity } from "@staffan/db";

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 64;
const FAKE_PASSWORD_HASH = `scrypt:${SCRYPT_COST}:${SCRYPT_BLOCK_SIZE}:${SCRYPT_PARALLELIZATION}:${Buffer.alloc(16).toString("base64url")}:${Buffer.alloc(SCRYPT_KEY_LENGTH).toString("base64url")}`;

export const SESSION_COOKIE_NAME = "staffan_session";

export interface AuthenticatedSession {
  expiresAt: string;
  operator: OperatorIdentity;
  token: string;
}

export interface AuthService {
  login(username: string, password: string): Promise<AuthenticatedSession | null>;
  logout(token: string): Promise<void>;
  verify(token: string): Promise<OperatorIdentity | null>;
}

export function createAuthService(
  repository: AuthRepository,
  options: { sessionTtlHours: number },
): AuthService {
  return {
    async login(username, password) {
      const operator = await repository.findOperator(username);
      const passwordMatches = await verifyPassword(
        password,
        operator?.passwordHash ?? FAKE_PASSWORD_HASH,
      );
      if (operator === null || !operator.active || !passwordMatches) return null;

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + options.sessionTtlHours * 60 * 60 * 1_000);
      await repository.createSession({
        expiresAt,
        operatorId: operator.id,
        tokenHash: hashSessionToken(token),
      });
      return {
        expiresAt: expiresAt.toISOString(),
        operator: { id: operator.id, username: operator.username },
        token,
      };
    },
    async verify(token) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
      return repository.findSession(hashSessionToken(token));
    },
    async logout(token) {
      if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
        await repository.revokeSession(hashSessionToken(token));
      }
    },
  };
}

export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 1_000) {
    throw new Error("Lösenordet måste innehålla minst 12 tecken");
  }
  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION);
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(password: string, encodedHash: string) {
  const parsed = parsePasswordHash(encodedHash);
  if (parsed === null) return false;
  const actual = await derivePassword(
    password,
    parsed.salt,
    parsed.cost,
    parsed.blockSize,
    parsed.parallelization,
  );
  return actual.length === parsed.hash.length && timingSafeEqual(actual, parsed.hash);
}

export function isPasswordHash(value: string) {
  return parsePasswordHash(value) !== null;
}

function parsePasswordHash(value: string) {
  const [algorithm, costValue, blockSizeValue, parallelizationValue, saltValue, hashValue] =
    value.split(":");
  const cost = Number(costValue);
  const blockSize = Number(blockSizeValue);
  const parallelization = Number(parallelizationValue);
  if (
    algorithm !== "scrypt" ||
    cost !== SCRYPT_COST ||
    blockSize !== SCRYPT_BLOCK_SIZE ||
    parallelization !== SCRYPT_PARALLELIZATION ||
    saltValue === undefined ||
    hashValue === undefined
  ) {
    return null;
  }
  try {
    const salt = Buffer.from(saltValue, "base64url");
    const hash = Buffer.from(hashValue, "base64url");
    return salt.length === 16 && hash.length === SCRYPT_KEY_LENGTH
      ? { blockSize, cost, hash, parallelization, salt }
      : null;
  } catch {
    return null;
  }
}

function derivePassword(
  password: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelization: number,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: cost, p: parallelization, r: blockSize },
      (error, derivedKey) => (error === null ? resolve(derivedKey) : reject(error)),
    );
  });
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
