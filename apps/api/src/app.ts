import multipart from "@fastify/multipart";
import { callOffApprovalSchema } from "@staffan/core";
import {
  ApprovalConflictError,
  ApprovalValidationError,
  checkDatabase,
  type IngressDiscoveryRecord,
  type OperatorIdentity,
  type ReviewRecord,
} from "@staffan/db";
import {
  EavropAdapterError,
  PdfTextExtractionError,
  eavropContent,
  extractPdfText,
  processCallOff,
  type CallOffReviewRepository,
  type EavropFetchResult,
  type EavropPortal,
  type IntakeResult,
  type ModelGateway,
  type OcrEngine,
} from "@staffan/ingress";
import Fastify from "fastify";
import { z } from "zod";

import { SESSION_COOKIE_NAME, type AuthService } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    operator: OperatorIdentity | null;
  }
}

export type DatabaseCheck = () => Promise<void>;

export interface CallOffApiRepository extends CallOffReviewRepository {
  approve(
    extractionId: string,
    fields: z.infer<typeof callOffApprovalSchema>,
    approvedByOperatorId: string,
  ): Promise<unknown>;
  getReview(extractionId: string): Promise<ReviewRecord | null>;
  listReviews(): Promise<ReviewRecord[]>;
}

export interface CallOffDependencies {
  discoveryRepository?: { list(limit?: number): Promise<IngressDiscoveryRecord[]> };
  eavrop?: EavropPortal;
  gateway: ModelGateway;
  ocr?: OcrEngine;
  repository: CallOffApiRepository;
}

export function buildApp(
  databaseCheck: DatabaseCheck = checkDatabase,
  callOffDependencies?: CallOffDependencies,
  auth?: { cookieSecure: boolean; service: AuthService },
) {
  const app = Fastify({ logger: false });
  app.decorateRequest("operator", null);

  void app.register(multipart, { limits: { fileSize: 10_000_000, files: 1 } });

  app.addHook("onRequest", async (request, reply) => {
    const route = request.url.split("?", 1)[0];
    if (route === "/health" || route === "/auth/login") return;
    if (auth === undefined) {
      return reply.status(503).send({ error: "Autentisering är inte konfigurerad" });
    }
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const operator = token === null ? null : await auth.service.verify(token);
    if (operator === null) {
      return reply.status(401).send({ error: "Inloggning krävs" });
    }
    request.operator = operator;
  });

  app.get("/health", async (_request, reply) => {
    try {
      await databaseCheck();
      return { status: "ok", database: "ok" } as const;
    } catch (error) {
      app.log.error({ error }, "Database health check failed");
      return reply.status(503).send({ status: "error", database: "unavailable" });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    if (auth === undefined) {
      return reply.status(503).send({ error: "Autentisering är inte konfigurerad" });
    }
    const credentials = z
      .object({
        password: z.string().min(1).max(1_000),
        username: z.string().trim().min(1).max(100),
      })
      .parse(request.body);
    const session = await auth.service.login(credentials.username, credentials.password);
    if (session === null) {
      return reply.status(401).send({ error: "Felaktigt användarnamn eller lösenord" });
    }
    reply.header("cache-control", "no-store");
    reply.header(
      "set-cookie",
      sessionCookie(session.token, new Date(session.expiresAt), auth.cookieSecure),
    );
    return { expiresAt: session.expiresAt, operator: session.operator };
  });

  app.get("/auth/session", async (request) => ({ operator: request.operator }));

  app.post("/auth/logout", async (request, reply) => {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    if (auth !== undefined && token !== null) await auth.service.logout(token);
    reply.header("set-cookie", expiredSessionCookie(auth?.cookieSecure ?? true));
    return { status: "signed_out" } as const;
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
    try {
      const parsed = await extractPdfText(data, {
        ...(callOffDependencies.ocr === undefined ? {} : { ocr: callOffDependencies.ocr }),
      });
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
    } catch (error) {
      if (error instanceof PdfTextExtractionError) {
        return reply.status(422).send({ error: error.message, code: error.code });
      }
      throw error;
    }
  });

  app.get("/call-offs/discoveries", async (_request, reply) => {
    if (callOffDependencies?.discoveryRepository === undefined) return unavailable(reply);
    try {
      return await callOffDependencies.discoveryRepository.list();
    } catch (error) {
      app.log.error({ error }, "Could not list ingress discoveries");
      return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
    }
  });

  app.post("/call-offs/import-eavrop", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    if (callOffDependencies.eavrop === undefined) {
      return reply.status(503).send({ error: "e-Avrop-integrationen är inte konfigurerad" });
    }
    const body = z.object({ url: z.url().max(2_000) }).parse(request.body);

    let portalResult: EavropFetchResult;
    try {
      portalResult = await callOffDependencies.eavrop.fetchCallOff(body.url);
    } catch (error) {
      if (error instanceof EavropAdapterError) {
        return reply
          .status(error.code === "invalid_url" ? 400 : 502)
          .send({ error: error.message, step: error.step });
      }
      app.log.error({ error }, "Could not fetch e-Avrop call-off");
      return reply.status(502).send({ error: "e-Avrop kunde inte hämtas" });
    }

    try {
      const content = await eavropContent(portalResult, {
        ...(callOffDependencies.ocr === undefined ? {} : { ocr: callOffDependencies.ocr }),
      });
      const result = await runIntake(
        {
          content,
          externalRef: portalResult.externalRef,
          fileName: `e-avrop-${portalResult.externalRef ?? "avrop"}.txt`,
          mediaType: "text/plain",
          sourceSystem: "e-avrop",
          sourceType: "raw_text",
        },
        callOffDependencies,
      );
      return reply.status(201).send({
        ...result,
        portal: {
          attachmentCount: portalResult.attachments.length,
          log: portalResult.log,
        },
      });
    } catch (error) {
      app.log.error({ error }, "Could not persist e-Avrop intake");
      return reply.status(503).send({ error: "Databasen är inte tillgänglig" });
    }
  });

  app.post("/call-offs/reviews/:id/approve", async (request, reply) => {
    if (callOffDependencies === undefined) return unavailable(reply);
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const fields = callOffApprovalSchema.parse(request.body);
    try {
      if (request.operator === null) return reply.status(401).send({ error: "Inloggning krävs" });
      return await callOffDependencies.repository.approve(id, fields, request.operator.id);
    } catch (error) {
      if (error instanceof ApprovalConflictError) {
        return reply.status(409).send({ error: error.message });
      }
      if (error instanceof ApprovalValidationError) {
        return reply.status(400).send({ error: error.message });
      }
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

function readCookie(header: string | undefined, name: string) {
  if (header === undefined) return null;
  for (const part of header.split(";")) {
    const [cookieName, ...cookieValue] = part.trim().split("=");
    if (cookieName === name) return cookieValue.join("=") || null;
  }
  return null;
}

function sessionCookie(token: string, expiresAt: Date, secure: boolean) {
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${expiresAt.toUTCString()}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

function expiredSessionCookie(secure: boolean) {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
