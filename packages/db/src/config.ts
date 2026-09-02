import { z } from "zod";

const databaseConfigSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgres://").or(z.url().startsWith("postgresql://")),
});

export function readDatabaseUrl(environment: NodeJS.ProcessEnv = process.env): string {
  return databaseConfigSchema.parse(environment).DATABASE_URL;
}
