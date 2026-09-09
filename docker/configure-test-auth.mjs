import { appendFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";

const environmentFile = process.env.GITHUB_ENV;
if (!environmentFile) throw new Error("GITHUB_ENV saknas");

const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N: 16_384, p: 1, r: 8 });
const encodedHash = [
  "scrypt",
  16_384,
  8,
  1,
  salt.toString("base64url"),
  hash.toString("base64url"),
].join(":");

console.log(`::add-mask::${password}`);
appendFileSync(
  environmentFile,
  `OPERATOR_USERNAME=ci-operator\nOPERATOR_PASSWORD=${password}\nOPERATOR_PASSWORD_HASH=${encodedHash}\n`,
  "utf8",
);
