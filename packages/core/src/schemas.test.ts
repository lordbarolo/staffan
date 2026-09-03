import { describe, expect, it } from "vitest";

import { callOffApprovalSchema, callOffExtractionSchema } from "./index.js";

const completeFields = {
  externalRef: "AV-001",
  sourceSystem: "manual",
  careProvider: "Exempel kommun",
  organizationNumber: "212000-0000",
  administration: "Vård och omsorg",
  unit: "Hälso- och sjukvård",
  requester: { name: "Test Beställare", phone: null, email: null },
  role: "Sjuksköterska",
  specialty: null,
  competenceRequirements: [],
  location: "Exempelstad",
  periodStart: "2026-06-01",
  periodEnd: "2026-08-01",
  scope: { consultantCount: 1, description: "En konsult, heltid" },
  schedule: "Dag och kväll",
  onCall: false,
  introduction: null,
  mandatoryRequirements: ["Legitimation"],
  preferences: [],
  criteria: [],
  priorities: [],
  commercialTerms: null,
  submissionDeadline: "2026-01-25",
  otherTerms: [],
};

describe("CallOff schemas", () => {
  it("accepts a complete CallOff for approval", () => {
    expect(callOffApprovalSchema.parse(completeFields)).toEqual(completeFields);
  });

  it("keeps missing extraction fields explicit but blocks approval", () => {
    const extraction = {
      ...completeFields,
      careProvider: null,
      confidence: 0.4,
      fieldConfidence: { careProvider: 0 },
      fieldProvenance: {},
    };

    expect(callOffExtractionSchema.safeParse(extraction).success).toBe(true);
    expect(callOffApprovalSchema.safeParse(extraction).success).toBe(false);
  });
});
