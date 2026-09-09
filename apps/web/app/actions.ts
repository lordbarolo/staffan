"use server";

import { callOffApprovalSchema } from "@staffan/core";
import { redirect } from "next/navigation";
import { z } from "zod";

import { authenticatedApiFetch, AuthenticationRequiredError } from "./auth";

const intakeResponseSchema = z.object({ extraction: z.object({ id: z.uuid() }) });

export async function importText(formData: FormData) {
  let destination: string;
  try {
    const response = await authenticatedApiFetch("/call-offs/import-text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content: formData.get("content"),
        externalRef: optionalText(formData.get("externalRef")),
        sourceSystem: "manual",
      }),
    });
    destination = await intakeDestination(response);
  } catch (error) {
    destination = errorDestination(error);
  }
  redirect(destination);
}

export async function importPdf(formData: FormData) {
  let destination: string;
  try {
    const upload = new FormData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Välj en PDF-fil");
    upload.set("file", file);
    const response = await authenticatedApiFetch("/call-offs/import-pdf", {
      method: "POST",
      body: upload,
    });
    destination = await intakeDestination(response);
  } catch (error) {
    destination = errorDestination(error);
  }
  redirect(destination);
}

export async function importEavrop(formData: FormData) {
  let destination: string;
  try {
    const response = await authenticatedApiFetch("/call-offs/import-eavrop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: requiredText(formData.get("url")) }),
    });
    destination = await intakeDestination(response);
  } catch (error) {
    destination = errorDestination(error);
  }
  redirect(destination);
}

export async function approveCallOff(formData: FormData) {
  const extractionId = z.uuid().parse(formData.get("extractionId"));
  let destination: string;
  try {
    const fields = callOffApprovalSchema.parse({
      externalRef: optionalText(formData.get("externalRef")),
      sourceSystem: requiredText(formData.get("sourceSystem")),
      careProvider: optionalText(formData.get("careProvider")),
      organizationNumber: optionalText(formData.get("organizationNumber")),
      administration: optionalText(formData.get("administration")),
      unit: optionalText(formData.get("unit")),
      requester: requester(formData),
      role: optionalText(formData.get("role")),
      specialty: optionalText(formData.get("specialty")),
      competenceRequirements: lines(formData.get("competenceRequirements")),
      location: optionalText(formData.get("location")),
      periodStart: optionalText(formData.get("periodStart")),
      periodEnd: optionalText(formData.get("periodEnd")),
      periodSegments: periodSegments(formData),
      scope: scope(formData),
      schedule: optionalText(formData.get("schedule")),
      onCall: formData.get("onCall") === "true" ? true : formData.get("onCall") === "false" ? false : null,
      introduction: optionalText(formData.get("introduction")),
      mandatoryRequirements: lines(formData.get("mandatoryRequirements")),
      preferences: lines(formData.get("preferences")),
      classifiedRequirements: classifiedRequirements(formData),
      criteria: lines(formData.get("criteria")),
      priorities: lines(formData.get("priorities")),
      requiredDocuments: lines(formData.get("requiredDocuments")),
      commercialTerms: optionalText(formData.get("commercialTerms")),
      submissionDeadline: optionalText(formData.get("submissionDeadline")),
      otherTerms: lines(formData.get("otherTerms")),
    });
    const response = await authenticatedApiFetch(`/call-offs/reviews/${extractionId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!response.ok) throw new Error(await responseError(response));
    destination = `/?review=${extractionId}&success=${encodeURIComponent("CallOff godkänd och sparad")}`;
  } catch (error) {
    destination =
      error instanceof AuthenticationRequiredError
        ? "/login"
        : `/?review=${extractionId}&${errorQuery(error)}`;
  }
  redirect(destination);
}

async function intakeDestination(response: Response) {
  if (!response.ok) throw new Error(await responseError(response));
  const result = intakeResponseSchema.parse(await response.json());
  return `/?review=${result.extraction.id}`;
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string; issues?: string[] } | null;
  return body?.issues?.join(", ") ?? body?.error ?? `API svarade ${response.status}`;
}

function optionalText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text === "" ? null : text;
}

function requiredText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function lines(value: FormDataEntryValue | null) {
  return requiredText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function requester(formData: FormData) {
  const result = {
    name: optionalText(formData.get("requesterName")),
    phone: optionalText(formData.get("requesterPhone")),
    emails: lines(formData.get("requesterEmails")),
  };
  return result.name === null && result.phone === null && result.emails.length === 0 ? null : result;
}

function scope(formData: FormData) {
  const count = optionalText(formData.get("consultantCount"));
  const description = optionalText(formData.get("scopeDescription"));
  if (count === null && description === null) return null;
  return { consultantCount: count === null ? null : Number(count), description };
}

function periodSegments(formData: FormData) {
  const count = Number(requiredText(formData.get("periodSegmentCount")) || "0");
  return Array.from({ length: count }, (_, index) => {
    const prefix = `periodSegment.${index}`;
    return {
      label: optionalText(formData.get(`${prefix}.label`)),
      periodStart: optionalText(formData.get(`${prefix}.periodStart`)),
      periodEnd: optionalText(formData.get(`${prefix}.periodEnd`)),
      workWeeks: lines(formData.get(`${prefix}.workWeeks`)).map(parseWorkWeek),
      schedule: optionalText(formData.get(`${prefix}.schedule`)),
      onCall:
        formData.get(`${prefix}.onCall`) === "true"
          ? true
          : formData.get(`${prefix}.onCall`) === "false"
            ? false
            : null,
    };
  });
}

function classifiedRequirements(formData: FormData) {
  const count = Number(requiredText(formData.get("classifiedRequirementCount")) || "0");
  return Array.from({ length: count }, (_, index) => {
    const prefix = `classifiedRequirement.${index}`;
    return {
      level: requiredText(formData.get(`${prefix}.level`)),
      category: requiredText(formData.get(`${prefix}.category`)),
      text: requiredText(formData.get(`${prefix}.text`)),
      evidenceRequired: optionalText(formData.get(`${prefix}.evidenceRequired`)),
    };
  }).filter((requirement) => requirement.text !== "");
}

function parseWorkWeek(value: string) {
  const match = /^(?:(\d{4})[- ]?)?(?:v|w)?\s*(\d{1,2})$/i.exec(value);
  if (match === null) throw new Error(`Ogiltig arbetsvecka: ${value}`);
  return {
    year: match[1] === undefined ? null : Number(match[1]),
    week: Number(match[2]),
  };
}

function errorDestination(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return "/login";
  return `/?${errorQuery(error)}`;
}

function errorQuery(error: unknown) {
  return `error=${encodeURIComponent(error instanceof Error ? error.message : "Okänt fel")}`;
}
