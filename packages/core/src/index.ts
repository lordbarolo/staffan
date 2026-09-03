import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ange datum som ÅÅÅÅ-MM-DD");

export const sourceTypeSchema = z.enum(["raw_text", "pdf"]);

export const fieldSourceSchema = z.object({
  artifactId: z.uuid(),
  excerpt: z.string().min(1).max(500),
  locator: z.string().min(1).max(100).nullable(),
});

export const callOffFieldsSchema = z.object({
  externalRef: z.string().min(1).max(200).nullable(),
  sourceSystem: z.string().min(1).max(100),
  careProvider: z.string().min(1).max(300).nullable(),
  organizationNumber: z.string().min(1).max(50).nullable(),
  administration: z.string().min(1).max(300).nullable(),
  unit: z.string().min(1).max(300).nullable(),
  requester: z
    .object({
      name: z.string().min(1).max(200).nullable(),
      phone: z.string().min(1).max(100).nullable(),
      email: z.email().nullable(),
    })
    .nullable(),
  role: z.string().min(1).max(200).nullable(),
  specialty: z.string().min(1).max(300).nullable(),
  competenceRequirements: z.array(z.string().min(1).max(500)).max(50),
  location: z.string().min(1).max(500).nullable(),
  periodStart: isoDate.nullable(),
  periodEnd: isoDate.nullable(),
  scope: z
    .object({
      consultantCount: z.number().int().positive().nullable(),
      description: z.string().min(1).max(500).nullable(),
    })
    .nullable(),
  schedule: z.string().min(1).max(1_000).nullable(),
  onCall: z.boolean().nullable(),
  introduction: z.string().min(1).max(2_000).nullable(),
  mandatoryRequirements: z.array(z.string().min(1).max(1_000)).max(100),
  preferences: z.array(z.string().min(1).max(1_000)).max(100),
  criteria: z.array(z.string().min(1).max(1_000)).max(100),
  priorities: z.array(z.string().min(1).max(1_000)).max(100),
  commercialTerms: z.string().min(1).max(2_000).nullable(),
  submissionDeadline: isoDate.nullable(),
  otherTerms: z.array(z.string().min(1).max(1_000)).max(100),
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
    ["periodStart", value.periodStart],
    ["periodEnd", value.periodEnd],
    ["scope", value.scope],
    ["schedule", value.schedule],
    ["submissionDeadline", value.submissionDeadline],
  ] as const;

  for (const [field, fieldValue] of required) {
    if (fieldValue === null) {
      context.addIssue({ code: "custom", message: "Fältet krävs före godkännande", path: [field] });
    }
  }

  if (value.periodStart !== null && value.periodEnd !== null && value.periodEnd < value.periodStart) {
    context.addIssue({ code: "custom", message: "Slutdatum måste vara samma som eller efter startdatum", path: ["periodEnd"] });
  }
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
