import { describe, expect, it } from "vitest";

import {
  deriveEavropExternalRef,
  EavropAdapterError,
  isEavropAttachmentCandidate,
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
});
