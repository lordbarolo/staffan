import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";

import { eavropContent, extractPdfText } from "./documents.js";

describe("document extraction", () => {
  it("extracts spreadsheet text even when e-Avrop reports an unknown media type", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Behov");
    sheet.addRow(["Roll", "Sjuksköterska"]);
    sheet.addRow(["Omfattning", "100 %"]);
    const content = new Uint8Array(await workbook.xlsx.writeBuffer());

    const result = await eavropContent({
      sourceUrl: "https://www.e-avrop.com/notice.aspx?id=42",
      externalRef: "42",
      pageText: "Avrop",
      attachments: [
        {
          sourceUrl: "https://www.e-avrop.com/AttachmentDispatcher.aspx?id=1",
          fileName: "Anbudsinbjudan.xlsx",
          mediaType: "application/octet-stream",
          content,
        },
      ],
      log: [],
    });

    expect(result).toContain("Arbetsblad: Behov");
    expect(result).toContain("Roll\tSjuksköterska");
    expect(result).toContain("Omfattning\t100 %");
  });

  it("runs OCR only for image-based pages and keeps embedded text from other pages", async () => {
    const recognizePng = vi
      .fn()
      .mockResolvedValueOnce("Syntetiskt avrop vecka 22")
      .mockResolvedValueOnce("Ska-krav: giltig legitimation");
    const result = await extractPdfText(new Uint8Array([1, 2, 3]), {
      ocr: { recognizePng },
      pdfTools: {
        async readText() {
          return {
            pages: [
              { pageNumber: 1, text: "" },
              { pageNumber: 2, text: "Den här sidan har tillräckligt mycket maskinläsbar text för att inte OCR-tolkas." },
              { pageNumber: 3, text: "" },
            ],
            totalPages: 3,
          };
        },
        async renderPages(_data, pageNumbers) {
          expect(pageNumbers).toEqual([1, 3]);
          return pageNumbers.map((pageNumber) => ({ image: new Uint8Array([pageNumber]), pageNumber }));
        },
      },
    });

    expect(result).toMatchObject({ ocrPageCount: 2, totalPages: 3, usedOcr: true });
    expect(result.text).toContain("[Sida 1]\nSyntetiskt avrop vecka 22");
    expect(result.text).toContain("[Sida 2]\nDen här sidan har tillräckligt mycket");
    expect(result.text).toContain("[Sida 3]\nSka-krav: giltig legitimation");
    expect(recognizePng).toHaveBeenCalledTimes(2);
  });

  it("makes a missing OCR engine explicit for scanned PDFs", async () => {
    const promise = extractPdfText(new Uint8Array([1]), {
      pdfTools: {
        async readText() {
          return { pages: [{ pageNumber: 1, text: "" }], totalPages: 1 };
        },
        async renderPages() {
          throw new Error("ska inte anropas");
        },
      },
    });

    await expect(promise).rejects.toMatchObject({ code: "ocr_required" });
  });
});
