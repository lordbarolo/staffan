import multipart from "@fastify/multipart";
import { callOffApprovalSchema } from "@staffan/core";
import { checkDatabase, type ReviewRecord } from "@staffan/db";
import {
  EavropAdapterError,
  processCallOff,
  type CallOffReviewRepository,
  type EavropFetchResult,
  type EavropPortal,
  type IntakeResult,
  type ModelGateway,
} from "@staffan/ingress";
import ExcelJS from "exceljs";
import Fastify from "fastify";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

const MAX_EXTRACTED_ATTACHMENT_CHARS = 200_000;

export type DatabaseCheck = () => Promise<void>;

export interface CallOffApiRepository extends CallOffReviewRepository {
  approve(extractionId: string, fields: z.infer<typeof callOffApprovalSchema>): Promise<unknown>;
  getReview(extractionId: string): Promise<ReviewRecord | null>;
  listReviews(): Promise<ReviewRecord[]>;
}

export interface CallOffDependencies {
  eavrop?: EavropPortal;
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
      const content = await eavropContent(portalResult);
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

export async function eavropContent(result: EavropFetchResult) {
  const sections = ["e-Avrop-sida", result.pageText];

  for (const attachment of result.attachments) {
    sections.push(`Bilaga: ${attachment.fileName}`);
    try {
      sections.push(limitAttachmentText(await extractAttachmentText(attachment)));
    } catch {
      sections.push(`[Bilagan ${attachment.fileName} kunde inte texttolkas]`);
    }
  }

  return sections.filter((section) => section.trim() !== "").join("\n\n---\n\n");
}

async function extractAttachmentText(attachment: EavropFetchResult["attachments"][number]) {
  const content = Buffer.from(attachment.content);
  if (attachment.mediaType === "application/pdf" || /\.pdf$/i.test(attachment.fileName)) {
    const parser = new PDFParse({ data: content });
    try {
      return (await parser.getText()).text.trim();
    } finally {
      await parser.destroy();
    }
  }
  if (/\.docx$/i.test(attachment.fileName)) {
    return (await mammoth.extractRawText({ buffer: content })).value.trim();
  }
  if (/\.xlsx$/i.test(attachment.fileName)) {
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = content as unknown as Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(workbookBuffer);
    const lines: string[] = [];
    workbook.eachSheet((sheet) => {
      lines.push(`Arbetsblad: ${sheet.name}`);
      sheet.eachRow({ includeEmpty: false }, (row) => {
        const cells: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell) => {
          const text = spreadsheetCellText(cell.value).replace(/\s+/g, " ").trim();
          if (text !== "") cells.push(text);
        });
        if (cells.length > 0) lines.push(cells.join("\t"));
      });
    });
    return lines.join("\n").trim();
  }
  if (/^(?:text\/|application\/(?:json|xml))/.test(attachment.mediaType)) {
    return new TextDecoder().decode(attachment.content).trim();
  }
  return `[Hämtad bilaga i formatet ${attachment.mediaType}; ingen text kunde extraheras]`;
}

function spreadsheetCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return "";

  const cell = value as Record<string, unknown>;
  if (Array.isArray(cell.richText)) {
    return cell.richText
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  for (const key of ["result", "text", "error"] as const) {
    if (key in cell) return spreadsheetCellText(cell[key]);
  }
  return "";
}

function limitAttachmentText(value: string) {
  if (value.length <= MAX_EXTRACTED_ATTACHMENT_CHARS) return value;
  return `${value.slice(0, MAX_EXTRACTED_ATTACHMENT_CHARS)}\n[Bilagetexten har kortats]`;
}

function unavailable(reply: { status(code: number): { send(body: unknown): unknown } }) {
  return reply.status(503).send({ error: "CallOff-tjänsten är inte konfigurerad" });
}
