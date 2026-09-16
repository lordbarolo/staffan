import { describe, expect, it } from "vitest";
import type { BrowserContext, Page } from "playwright";

import {
  deriveEavropExternalRef,
  downloadEavropAttachments,
  discoverEavropCallOffLinks,
  EavropAdapterError,
  extractEavropPageText,
  findEavropCallOffUrlInEmail,
  hasMeaningfulEavropContent,
  isEavropAttachmentCandidate,
  isAllowedEavropRequest,
  loginToEavrop,
  PlaywrightEavropPortalAdapter,
  resolveEavropDocumentsUrl,
  validateEavropUrl,
} from "./eavrop.js";

describe("e-Avrop adapter boundaries", () => {
  it("only accepts HTTPS links hosted by e-avrop.com", () => {
    expect(validateEavropUrl("https://www.e-avrop.com/notice.aspx?id=42#details")).toBe(
      "https://www.e-avrop.com/notice.aspx?id=42",
    );
    expect(() => validateEavropUrl("http://www.e-avrop.com/notice.aspx?id=42")).toThrow(
      EavropAdapterError,
    );
    expect(() => validateEavropUrl("https://e-avrop.com.example.test/notice.aspx?id=42")).toThrow(
      EavropAdapterError,
    );
    expect(() => validateEavropUrl("https://user:pass@www.e-avrop.com/notice.aspx?id=42")).toThrow(
      EavropAdapterError,
    );
  });

  it("blocks browser traffic outside the e-Avrop HTTPS origin boundary", () => {
    expect(isAllowedEavropRequest("https://www.e-avrop.com/app.js")).toBe(true);
    expect(isAllowedEavropRequest("https://cdn.example.invalid/app.js")).toBe(false);
    expect(isAllowedEavropRequest("http://www.e-avrop.com/app.js")).toBe(false);
  });

  it("does not fill credentials after navigation to a foreign domain", async () => {
    let locatorCalls = 0;
    const page = {
      url: () => "https://attacker.example.invalid/login",
      locator: () => {
        locatorCalls += 1;
        throw new Error("Credentials must not be accessed");
      },
    } as unknown as Page;

    await expect(
      loginToEavrop(page, { username: "synthetic-user", password: "synthetic-password" }, 100),
    ).rejects.toMatchObject({ code: "invalid_url", step: "login" });
    expect(locatorCalls).toBe(0);
  });

  it("derives a stable external reference without retaining the whole URL", () => {
    expect(deriveEavropExternalRef("https://www.e-avrop.com/notice.aspx?NoticeId=AV-2026-42")).toBe(
      "AV-2026-42",
    );
    expect(deriveEavropExternalRef("https://www.e-avrop.com/calloff/underlag.pdf")).toBe(
      "underlag.pdf",
    );
    expect(deriveEavropExternalRef("https://www.e-avrop.com/Default.aspx")).toBeNull();
  });

  it("requires both portal credentials before a browser can be started", () => {
    expect(() => new PlaywrightEavropPortalAdapter({ username: "", password: "secret" })).toThrow(
      "e-Avrop-användarnamn och lösenord måste anges",
    );
  });

  it("follows the procurement-document page while keeping help pages out of attachments", () => {
    expect(
      resolveEavropDocumentsUrl(
        [
          { href: "/information/upphandling/anbudsInlamning/Lamna_Anbud.htm", text: "Mer om anbudsinlämning" },
          { href: "inbjudan/InvitationInfo.aspx?projectId=136958", text: "Upphandlingsdokument" },
        ],
        "https://www.e-avrop.com/upphandlingscenterfbr/e-Upphandling/leverantor/Procurement.aspx?id=135948",
      ),
    ).toBe(
      "https://www.e-avrop.com/upphandlingscenterfbr/e-Upphandling/leverantor/inbjudan/InvitationInfo.aspx?projectId=136958",
    );
    expect(isEavropAttachmentCandidate("https://www.e-avrop.com/AttachmentDispatcher.aspx?id=1", "Skakrav.pdf")).toBe(true);
    expect(
      isEavropAttachmentCandidate(
        "https://www.e-avrop.com/information/upphandling/anbudsInlamning/Lamna_Anbud.htm",
        "Mer om anbudsinlämning",
      ),
    ).toBe(false);
  });

  it("discovers only canonical call-off links and removes duplicates", () => {
    expect(
      discoverEavropCallOffLinks(
        [
          { href: "/unit/e-Upphandling/leverantor/Procurement.aspx?id=AV-101" },
          { href: "/unit/e-Upphandling/leverantor/Procurement.aspx?id=AV-101#details" },
          { href: "/unit/e-Upphandling/leverantor/Procurement.aspx" },
          { href: "/AttachmentDispatcher.aspx?id=1" },
          { href: "https://example.invalid/notice?id=2" },
        ],
        "https://www.e-avrop.com/unit/dashboard.aspx",
      ),
    ).toEqual([
      {
        externalRef: "AV-101",
        sourceUrl:
          "https://www.e-avrop.com/unit/e-Upphandling/leverantor/Procurement.aspx?id=AV-101",
      },
    ]);
  });

  it("reads procurement content from an embedded e-Avrop frame and rejects a navigation shell", async () => {
    const navigationShell = "e-Avrop Mina sidor Hjälp Logga in Upphandling";
    const procurementText = [
      "Dynamisk leverantörspool för bemanning sjuksköterskor",
      "Upphandlande organisation: Exempel kommun",
      "CPV 85141200",
      "Avtalstid 2026-07-01 till 2032-09-30",
      "Sista svarsdatum 2032-09-30",
      "Uppskattat kontraktsvärde 20 000 000 SEK",
    ].join("\n");
    const page = {
      frames: () => [
        {
          evaluate: async () => navigationShell,
          url: () => "https://www.e-avrop.com/unit/e-Upphandling/Announcement.aspx?id=42",
        },
        {
          evaluate: async () => procurementText,
          url: () => "https://www.e-avrop.com/unit/e-Upphandling/leverantor/Procurement.aspx?id=42",
        },
      ],
    } as unknown as Page;

    const pageText = await extractEavropPageText(page);

    expect(pageText).toContain(procurementText);
    expect(hasMeaningfulEavropContent(navigationShell)).toBe(false);
    expect(hasMeaningfulEavropContent(pageText)).toBe(true);
  });

  it("identifies an e-Avrop call-off link in untrusted email without accepting other hosts", () => {
    const rawEmail = [
      "From: sender@example.invalid",
      "Öppna https://tracker.example.invalid/click?id=1",
      "Avrop: https://www.e-avrop.com/unit/e-Upphandling/leverantor/Procurement.aspx?id=AV-EMAIL-1&amp;view=1",
    ].join("\r\n");

    expect(findEavropCallOffUrlInEmail(rawEmail)).toBe(
      "https://www.e-avrop.com/unit/e-Upphandling/leverantor/Procurement.aspx?id=AV-EMAIL-1&view=1",
    );
    expect(findEavropCallOffUrlInEmail("https://attacker.invalid/notice?id=1")).toBeNull();
  });

  it("keeps individual 404 and attachment-limit outcomes", async () => {
    const page = {
      url: () => "https://www.e-avrop.com/notice.aspx?id=42",
      locator: () => ({
        evaluateAll: async () => [
          { href: "/files/missing.pdf", text: "missing.pdf" },
          { href: "/files/over-limit.pdf", text: "over-limit.pdf" },
        ],
      }),
    } as unknown as Page;
    const context = {
      request: {
        get: async () => ({ ok: () => false, status: () => 404 }),
      },
    } as unknown as BrowserContext;

    const result = await downloadEavropAttachments(page, context, 1, 1_000, 100);

    expect(result.attachments).toEqual([]);
    expect(result.statuses).toEqual([
      {
        detail: "Bilagan hoppades över eftersom gränsen är 1",
        fileName: "over-limit.pdf",
        status: "limit_exceeded",
      },
      {
        detail: "Bilagan svarade med HTTP 404",
        fileName: "missing.pdf",
        status: "http_error",
      },
    ]);
  });

  it("marks an oversized attachment instead of silently dropping it", async () => {
    const page = {
      url: () => "https://www.e-avrop.com/notice.aspx?id=42",
      locator: () => ({
        evaluateAll: async () => [{ href: "/files/large.pdf", text: "large.pdf" }],
      }),
    } as unknown as Page;
    const context = {
      request: {
        get: async () => ({
          body: async () => new Uint8Array(11),
          headers: () => ({ "content-type": "application/pdf" }),
          ok: () => true,
          status: () => 200,
          url: () => "https://www.e-avrop.com/files/large.pdf",
        }),
      },
    } as unknown as BrowserContext;

    const result = await downloadEavropAttachments(page, context, 20, 10, 100);

    expect(result.attachments).toEqual([]);
    expect(result.statuses).toEqual([
      {
        detail: "Bilagan överskred storleksgränsen 10 byte",
        fileName: "large.pdf",
        status: "too_large",
      },
    ]);
  });
});
