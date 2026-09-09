import { describe, expect, it } from "vitest";

import { callOffApprovalSchema, callOffExtractionSchema } from "./index.js";

const completeFields = {
  externalRef: "AV-001",
  sourceSystem: "manual",
  careProvider: "Exempel kommun",
  organizationNumber: "212000-0000",
  administration: "Vård och omsorg",
  unit: "Hälso- och sjukvård",
  requester: { name: "Test Beställare", phone: null, emails: [] },
  role: "Sjuksköterska",
  specialty: null,
  competenceRequirements: [],
  location: "Exempelstad",
  periodStart: "2026-06-01",
  periodEnd: "2026-08-01",
  periodSegments: [],
  scope: { consultantCount: 1, description: "En konsult, heltid" },
  schedule: "Dag och kväll",
  onCall: false,
  introduction: null,
  mandatoryRequirements: ["Legitimation"],
  preferences: [],
  classifiedRequirements: [],
  criteria: [],
  priorities: [],
  requiredDocuments: [],
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

  it("accepts reviewed period segments and work weeks without inventing a week year", () => {
    const segmented = {
      ...completeFields,
      periodStart: null,
      periodEnd: null,
      schedule: null,
      periodSegments: [
        {
          label: "Första perioden",
          periodStart: null,
          periodEnd: null,
          workWeeks: [
            { year: null, week: 22 },
            { year: 2027, week: 23 },
          ],
          schedule: "Dagtid",
          onCall: false,
        },
      ],
    };

    expect(callOffApprovalSchema.parse(segmented).periodSegments[0]?.workWeeks).toEqual([
      { year: null, week: 22 },
      { year: 2027, week: 23 },
    ]);
  });

  it("rejects a period segment with only one boundary date", () => {
    const result = callOffApprovalSchema.safeParse({
      ...completeFields,
      periodSegments: [
        {
          label: null,
          periodStart: "2027-05-01",
          periodEnd: null,
          workWeeks: [],
          schedule: "Dagtid",
          onCall: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an overall period with only one boundary date", () => {
    const result = callOffApprovalSchema.safeParse({
      ...completeFields,
      periodEnd: null,
      periodSegments: [
        {
          label: "Veckobaserad period",
          periodStart: null,
          periodEnd: null,
          workWeeks: [{ year: 2027, week: 22 }],
          schedule: "Dagtid",
          onCall: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty scope object", () => {
    expect(
      callOffApprovalSchema.safeParse({
        ...completeFields,
        scope: { consultantCount: null, description: null },
      }).success,
    ).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(
      callOffApprovalSchema.safeParse({
        ...completeFields,
        submissionDeadline: "2027-02-31",
      }).success,
    ).toBe(false);
  });

  it("requires every segment to contain a period and a schedule when no overall schedule exists", () => {
    const result = callOffApprovalSchema.safeParse({
      ...completeFields,
      periodStart: null,
      periodEnd: null,
      schedule: null,
      periodSegments: [
        {
          label: "Giltigt segment",
          periodStart: null,
          periodEnd: null,
          workWeeks: [{ year: 2027, week: 22 }],
          schedule: "Dagtid",
          onCall: null,
        },
        {
          label: "Ofullständigt segment",
          periodStart: null,
          periodEnd: null,
          workWeeks: [],
          schedule: null,
          onCall: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
