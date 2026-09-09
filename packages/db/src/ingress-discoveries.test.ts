import { describe, expect, it } from "vitest";

import { discoveryKey } from "./ingress-discoveries.js";

describe("discoveryKey", () => {
  it("uses an explicit portal reference as the stable deduplication key", () => {
    expect(
      discoveryKey({
        externalRef: "AV-2027-101",
        sourceUrl: "https://www.e-avrop.com/notice.aspx?id=AV-2027-101",
      }),
    ).toBe("ref:AV-2027-101");
  });

  it("hashes a canonical URL when the portal exposes no reference", () => {
    const sourceUrl = "https://www.e-avrop.com/calloff/current";
    const key = discoveryKey({ externalRef: null, sourceUrl });

    expect(key).toMatch(/^url:[a-f0-9]{64}$/);
    expect(key).not.toContain(sourceUrl);
    expect(discoveryKey({ externalRef: null, sourceUrl })).toBe(key);
  });
});
