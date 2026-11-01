import { z } from "zod";

const isoDate = z.iso.date({ error: "Ange ett giltigt datum som ÅÅÅÅ-MM-DD" });
const nonBlank = (maximum: number) => z.string().trim().min(1).max(maximum);
const nullableNonBlank = (maximum: number) => nonBlank(maximum).nullable();

export const workWeekSchema = z.object({
  year: z.number().int().min(2000).max(2200).nullable(),
  week: z.number().int().min(1).max(53),
});

export const periodSegmentSchema = z.object({
  label: nullableNonBlank(200),
  periodStart: isoDate.nullable(),
  periodEnd: isoDate.nullable(),
  workWeeks: z.array(workWeekSchema).max(106),
  schedule: nullableNonBlank(1_000),
  onCall: z.boolean().nullable(),
});

export const classifiedRequirementSchema = z.object({
  level: z.enum(["shall", "should"]),
  category: z.enum([
    "professional_license",
    "specialist_competence",
    "clinical_experience",
    "system_experience",
    "language",
    "availability",
    "documentation",
    "commercial",
    "other",
  ]),
  text: nonBlank(1_000),
  evidenceRequired: nullableNonBlank(1_000),
});

export const sourceTypeSchema = z.enum(["raw_text", "pdf"]);

export const fieldSourceSchema = z.object({
  artifactId: z.uuid(),
  excerpt: nonBlank(500),
  locator: nullableNonBlank(100),
});

export const callOffFieldsSchema = z.object({
  externalRef: nullableNonBlank(200),
  sourceSystem: nonBlank(100),
  careProvider: nullableNonBlank(300),
  organizationNumber: nullableNonBlank(50),
  administration: nullableNonBlank(300),
  unit: nullableNonBlank(300),
  requester: z
    .object({
      name: nullableNonBlank(200),
      phone: nullableNonBlank(100),
      emails: z.array(z.email()).max(20),
    })
    .nullable(),
  role: nullableNonBlank(200),
  specialty: nullableNonBlank(300),
  competenceRequirements: z.array(nonBlank(500)).max(50),
  location: nullableNonBlank(500),
  periodStart: isoDate.nullable(),
  periodEnd: isoDate.nullable(),
  periodSegments: z.array(periodSegmentSchema).max(50).default([]),
  scope: z
    .object({
      consultantCount: z.number().int().positive().nullable(),
      description: nullableNonBlank(500),
    })
    .nullable(),
  schedule: nullableNonBlank(1_000),
  onCall: z.boolean().nullable(),
  introduction: nullableNonBlank(2_000),
  mandatoryRequirements: z.array(nonBlank(1_000)).max(100),
  preferences: z.array(nonBlank(1_000)).max(100),
  classifiedRequirements: z.array(classifiedRequirementSchema).max(200).default([]),
  criteria: z.array(nonBlank(1_000)).max(100),
  priorities: z.array(nonBlank(1_000)).max(100),
  requiredDocuments: z.array(nonBlank(1_000)).max(100),
  commercialTerms: nullableNonBlank(2_000),
  submissionDeadline: isoDate.nullable(),
  otherTerms: z.array(nonBlank(1_000)).max(100),
});

export const callOffExtractionSchema = callOffFieldsSchema.extend({
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.string(), z.number().min(0).max(1)),
  fieldProvenance: z.record(z.string(), z.array(fieldSourceSchema).min(1)),
});

export const callOffApprovalSchema = callOffFieldsSchema.superRefine((value, context) => {
  const required = [
    ["careProvider", value.careProvider],
    ["role", value.role],
    ["location", value.location],
    ["scope", value.scope],
    ["submissionDeadline", value.submissionDeadline],
  ] as const;

  for (const [field, fieldValue] of required) {
    if (fieldValue === null) {
      context.addIssue({ code: "custom", message: "Fältet krävs före godkännande", path: [field] });
    }
  }

  if (
    value.scope !== null &&
    value.scope.consultantCount === null &&
    value.scope.description === null
  ) {
    context.addIssue({
      code: "custom",
      message: "Antal konsulter eller en omfattningsbeskrivning krävs före godkännande",
      path: ["scope"],
    });
  }

  if (value.periodStart !== null && value.periodEnd !== null && value.periodEnd < value.periodStart) {
    context.addIssue({ code: "custom", message: "Slutdatum måste vara samma som eller efter startdatum", path: ["periodEnd"] });
  }

  if ((value.periodStart === null) !== (value.periodEnd === null)) {
    context.addIssue({
      code: "custom",
      message: "Start- och slutdatum måste anges tillsammans",
      path: [value.periodStart === null ? "periodStart" : "periodEnd"],
    });
  }

  const hasOverallPeriod = value.periodStart !== null && value.periodEnd !== null;
  const hasSegmentPeriod = value.periodSegments.some(
    (segment) =>
      (segment.periodStart !== null && segment.periodEnd !== null) || segment.workWeeks.length > 0,
  );
  if (!hasOverallPeriod && !hasSegmentPeriod) {
    context.addIssue({
      code: "custom",
      message: "En sammanhängande period eller minst ett periodsegment krävs före godkännande",
      path: ["periodSegments"],
    });
  }

  if (value.schedule === null && !value.periodSegments.some((segment) => segment.schedule !== null)) {
    context.addIssue({ code: "custom", message: "Fältet krävs före godkännande", path: ["schedule"] });
  }

  value.periodSegments.forEach((segment, index) => {
    const hasSegmentPeriod =
      (segment.periodStart !== null && segment.periodEnd !== null) || segment.workWeeks.length > 0;
    if (!hasSegmentPeriod) {
      context.addIssue({
        code: "custom",
        message: "Periodsegmentet måste innehålla datum eller arbetsveckor",
        path: ["periodSegments", index],
      });
    }
    if (value.schedule === null && segment.schedule === null) {
      context.addIssue({
        code: "custom",
        message: "Schema krävs för varje periodsegment när övergripande schema saknas",
        path: ["periodSegments", index, "schedule"],
      });
    }
    if ((segment.periodStart === null) !== (segment.periodEnd === null)) {
      context.addIssue({
        code: "custom",
        message: "Start- och slutdatum måste anges tillsammans",
        path: ["periodSegments", index],
      });
    }
    if (
      segment.periodStart !== null &&
      segment.periodEnd !== null &&
      segment.periodEnd < segment.periodStart
    ) {
      context.addIssue({
        code: "custom",
        message: "Slutdatum måste vara samma som eller efter startdatum",
        path: ["periodSegments", index, "periodEnd"],
      });
    }
  });
});

export const callOffSchema = z.object({
  id: z.uuid(),
  artifactId: z.uuid(),
  status: z.enum(["in_review", "approved"]),
  extractionConfidence: z.number().min(0).max(1),
  sourceArtifacts: z.array(z.uuid()).min(1),
  fields: callOffFieldsSchema,
  fieldConfidence: z.record(z.string(), z.number().min(0).max(1)),
  fieldProvenance: z.record(z.string(), z.array(fieldSourceSchema).min(1)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const rawArtifactSchema = z.object({
  id: z.uuid(),
  sourceType: sourceTypeSchema,
  sourceSystem: z.string().min(1).max(100),
  externalRef: z.string().min(1).max(200).nullable(),
  fileName: z.string().min(1).max(255).nullable(),
  mediaType: z.string().min(1).max(100),
  content: z.string().min(1).max(2_000_000),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  receivedAt: z.string().datetime(),
});

export type CallOffFields = z.infer<typeof callOffFieldsSchema>;
export type CallOffExtraction = z.infer<typeof callOffExtractionSchema>;
export type CallOffApproval = z.infer<typeof callOffApprovalSchema>;
export type CallOff = z.infer<typeof callOffSchema>;
export type RawArtifact = z.infer<typeof rawArtifactSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type WorkWeek = z.infer<typeof workWeekSchema>;
export type PeriodSegment = z.infer<typeof periodSegmentSchema>;
export type ClassifiedRequirement = z.infer<typeof classifiedRequirementSchema>;
