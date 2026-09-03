import multipart from "@fastify/multipart";
import { callOffApprovalSchema } from "@staffan/core";
import { checkDatabase, type ReviewRecord } from "@staffan/db";
import {
  processCallOff,
  type CallOffReviewRepository,
  type IntakeResult,
  type ModelGateway,
} from "@staffan/ingress";
import Fastify from "fastify";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

export type DatabaseCheck = () => Promise<void>;

export interface CallOffApiRepository extends CallOffReviewRepository {
  approve(extractionId: string, fields: z.infer<typeof callOffApprovalSchema>): Promise<unknown>;
  getReview(extractionId: string): Promise<ReviewRecord | null>;
  listReviews(): Promise<ReviewRecord[]>;
}

export interface CallOffDependencies {
  gateway: ModelGateway;
  repository: CallOffApiRepository;
}

export function buildApp(
  databaseCheck: DatabaseCheck = checkDatabase,
  callOffDependencies?: CallOffDependencies,
) {
  const app = Fastify({ logger: false });

  void app.register(multipart, { limits: { fileSize: 10_000_000, files: 1 } });

  app.get("/health", async (_request, reply) => {
    try {
      await databaseCheck();
      return { status: "ok", database: "ok" } as const;
    } catch (error) {
      app.log.error({ error }, "Database health check failed");
      return reply.status(503).send({ status: "error", database: "unavailable" });
    }
  });

  app.get("/call-offs/reviews", async (_request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    try {
      return await callOffDependencies.repository.listReviews();
    } catch (error) {
      app.log.error({ error }, "Could not list call-off reviews");
      return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
    }
  });

  app.get("/call-offs/reviews/:id", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    try {
      const review = await callOffDependencies.repository.getReview(id);
      return review ?? reply.status(404).send({ error: "Granskningen finns inte" });
    } catch (error) {
      app.log.error({ error }, "Could not read call-off review");
      return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
    }
  });

  app.post("/call-offs/import-text", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    const body = z
      .object({
        content: z.string().min(1).max(2_000_000),
        externalRef: z.string().min(1).max(200).optional(),
        sourceSystem: z.string().min(1).max(100).default("manual"),
      })
      .parse(request.body);
    try {
      const result = await runIntake(
        {
          content: body.content,
          externalRef: body.externalRef ?? null,
          mediaType: "text/plain",
          sourceSystem: body.sourceSystem,
          sourceType: "raw_text",
        },
        callOffDependencies,
      );
      return reply.status(201).send(result);
    } catch (error) {
      app.log.error({ error }, "Could not persist text intake");
      return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
    }
  });

  app.post("/call-offs/import-pdf", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    const upload = await request.file();
    if (upload === undefined || upload.mimetype !== "application/pdf") {
      return reply.status(400).send({ error: "En PDF-fil krävs" });
    }
    const data = await upload.toBuffer();
    const parser = new PDFParse({ data });
    try {
      const parsed = await parser.getText();
      try {
        const result = await runIntake(
          {
            content: parsed.text,
            fileName: upload.filename,
            mediaType: upload.mimetype,
            sourceSystem: "pdf-upload",
            sourceType: "pdf",
          },
          callOffDependencies,
        );
        return reply.status(201).send(result);
      } catch (error) {
        app.log.error({ error }, "Could not persist PDF intake");
        return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
      }
    } finally {
      await parser.destroy();
    }
  });

  app.post("/call-offs/reviews/:id/approve", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const fields = callOffApprovalSchema.parse(request.body);
    try {
      return await callOffDependencies.repository.approve(id, fields);
    } catch (error) {
      app.log.error({ error }, "Could not approve call-off");
      return reply.status(503).send({ error: "CallOff kunde inte sparas" });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: "Ogiltig indata",
        issues: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
    }
    app.log.error({ error }, "Unhandled API error");
    return reply.status(500).send({ error: "Oväntat serverfel" });
  });

  return app;
}

async function runIntake(
  input: Parameters<typeof processCallOff>[0],
  dependencies: CallOffDependencies,
): Promise<IntakeResult> {
  return processCallOff(input, dependencies);
}

function unavailable(reply: { status(code: number): { send(body: unknown): unknown } }) {
  return reply.status(503).send({ error: "CallOff-tjänsten är inte konfigurerad" });
}
