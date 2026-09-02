import { checkDatabase } from "@staffan/db";
import Fastify from "fastify";

export type DatabaseCheck = () => Promise<void>;

export function buildApp(databaseCheck: DatabaseCheck = checkDatabase) {
  const app = Fastify({ logger: false });

  app.get("/health", async (_request, reply) => {
    try {
      await databaseCheck();
      return { status: "ok", database: "ok" } as const;
    } catch (error) {
      app.log.error({ error }, "Database health check failed");
      return reply.status(503).send({ status: "error", database: "unavailable" });
    }
  });

  return app;
}
