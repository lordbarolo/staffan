import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import type { EavropAttachment, EavropFetchResult } from "./eavrop.js";

const execFileAsync = promisify(execFile);
const DEFAULT_MIN_PAGE_TEXT_CHARS = 40;
const DEFAULT_MAX_PDF_PAGES = 40;
const DEFAULT_MAX_EXTRACTED_CHARS = 200_000;

export interface OcrEngine {
  recognizePng(input: { image: Uint8Array; language: string; pageNumber: number }): Promise<string>;
}

export interface PdfTools {
  readText(data: Uint8Array): Promise<{
    pages: Array<{ pageNumber: number; text: string }>;
    totalPages: number;
  }>;
  renderPages(
    data: Uint8Array,
    pageNumbers: number[],
  ): Promise<Array<{ image: Uint8Array; pageNumber: number }>>;
}

export interface PdfTextExtraction {
  ocrPageCount: number;
  text: string;
  totalPages: number;
  usedOcr: boolean;
}

export class PdfTextExtractionError extends Error {
  constructor(
    message: string,
    readonly code: "empty_pdf" | "ocr_failed" | "ocr_required" | "too_many_pages",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PdfTextExtractionError";
  }
}

export class TesseractCliOcrEngine implements OcrEngine {
  constructor(
    private readonly options: {
      executablePath?: string;
      timeoutMs?: number;
    } = {},
  ) {}

  async recognizePng(input: {
    image: Uint8Array;
    language: string;
    pageNumber: number;
  }): Promise<string> {
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "staffan-ocr-"));
    const imagePath = path.join(temporaryDirectory, `page-${input.pageNumber}.png`);
    try {
      await writeFile(imagePath, input.image);
      const result = await execFileAsync(
        this.options.executablePath ?? "tesseract",
        [imagePath, "stdout", "-l", input.language, "--psm", "6"],
        {
          encoding: "utf8",
          maxBuffer: 2_000_000,
          timeout: this.options.timeoutMs ?? 60_000,
          windowsHide: true,
        },
      );
      return normalizeText(result.stdout);
    } catch (error) {
      throw new PdfTextExtractionError(
        "OCR-motorn kunde inte tolka en PDF-sida",
        "ocr_failed",
        { cause: error },
      );
    } finally {
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  }
}

export async function extractPdfText(
  data: Uint8Array,
  options: {
    language?: string;
    maxPages?: number;
    minPageTextChars?: number;
    ocr?: OcrEngine;
    pdfTools?: PdfTools;
  } = {},
): Promise<PdfTextExtraction> {
  const pdfTools = options.pdfTools ?? pdfParseTools;
  const parsed = await pdfTools.readText(data);
  const maxPages = options.maxPages ?? DEFAULT_MAX_PDF_PAGES;
  if (parsed.totalPages > maxPages) {
    throw new PdfTextExtractionError(
      `PDF:en innehåller fler än ${maxPages} sidor`,
      "too_many_pages",
    );
  }

  const threshold = options.minPageTextChars ?? DEFAULT_MIN_PAGE_TEXT_CHARS;
  const pages = Array.from({ length: parsed.totalPages }, (_, index) => {
    const pageNumber = index + 1;
    return {
      pageNumber,
      text: normalizeText(parsed.pages.find((page) => page.pageNumber === pageNumber)?.text ?? ""),
    };
  });
  const pagesNeedingOcr = pages
    .filter((page) => page.text.length < threshold)
    .map((page) => page.pageNumber);

  if (pagesNeedingOcr.length > 0) {
    if (options.ocr === undefined) {
      throw new PdfTextExtractionError(
        "PDF:en innehåller bildsidor och kräver OCR",
        "ocr_required",
      );
    }
    const screenshots = await pdfTools.renderPages(data, pagesNeedingOcr);
    const screenshotByPage = new Map(screenshots.map((page) => [page.pageNumber, page.image]));
    for (const pageNumber of pagesNeedingOcr) {
      const image = screenshotByPage.get(pageNumber);
      if (image === undefined) {
        throw new PdfTextExtractionError(
          "En PDF-sida kunde inte renderas för OCR",
          "ocr_failed",
        );
      }
      const text = await options.ocr.recognizePng({
        image,
        language: options.language ?? "swe+eng",
        pageNumber,
      });
      const page = pages[pageNumber - 1];
      if (page !== undefined) page.text = text;
    }
  }

  const text = pages
    .filter((page) => page.text !== "")
    .map((page) => `[Sida ${page.pageNumber}]\n${page.text}`)
    .join("\n\n")
    .trim();
  if (text.length < 20) {
    throw new PdfTextExtractionError(
      "PDF:en saknar läsbart innehåll även efter texttolkning",
      "empty_pdf",
    );
  }

  return {
    ocrPageCount: pagesNeedingOcr.length,
    text,
    totalPages: parsed.totalPages,
    usedOcr: pagesNeedingOcr.length > 0,
  };
}

export async function eavropContent(
  result: EavropFetchResult,
  options: { ocr?: OcrEngine } = {},
) {
  const sections = ["e-Avrop-sida", result.pageText];

  for (const attachment of result.attachments) {
    sections.push(`Bilaga: ${attachment.fileName}`);
    try {
      sections.push(limitAttachmentText(await extractAttachmentText(attachment, options)));
    } catch {
      sections.push(`[Bilagan ${attachment.fileName} kunde inte texttolkas]`);
    }
  }

  return sections.filter((section) => section.trim() !== "").join("\n\n---\n\n");
}

async function extractAttachmentText(
  attachment: EavropAttachment,
  options: { ocr?: OcrEngine },
) {
  const content = Buffer.from(attachment.content);
  if (attachment.mediaType === "application/pdf" || /\.pdf$/i.test(attachment.fileName)) {
    return (
      await extractPdfText(content, {
        ...(options.ocr === undefined ? {} : { ocr: options.ocr }),
      })
    ).text;
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
  if (value.length <= DEFAULT_MAX_EXTRACTED_CHARS) return value;
  return `${value.slice(0, DEFAULT_MAX_EXTRACTED_CHARS)}\n[Bilagetexten har kortats]`;
}

function normalizeText(value: string) {
  return value
    .replaceAll("\u0000", "")
    .replaceAll("\r\n", "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const pdfParseTools: PdfTools = {
  async readText(data) {
    const parser = new PDFParse({ data: data.slice() });
    try {
      const result = await parser.getText();
      return {
        pages: result.pages.map((page) => ({ pageNumber: page.num, text: page.text })),
        totalPages: result.total,
      };
    } finally {
      await parser.destroy();
    }
  },
  async renderPages(data, pageNumbers) {
    const parser = new PDFParse({ data: data.slice() });
    try {
      const result = await parser.getScreenshot({
        desiredWidth: 2_000,
        imageBuffer: true,
        imageDataUrl: false,
        partial: pageNumbers,
      });
      return result.pages.map((page) => ({ image: page.data, pageNumber: page.pageNumber }));
    } finally {
      await parser.destroy();
    }
  },
};
