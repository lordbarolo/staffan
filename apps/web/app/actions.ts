"use server";

import { callOffApprovalSchema } from "@staffan/core";
import { redirect } from "next/navigation";
import { z } from "zod";

const apiUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";
const intakeResponseSchema = z.object({ extraction: z.object({ id: z.uuid() }) });

export async function importText(formData: FormData) {
  let destination: string;
  try {
    const response = await fetch(`${apiUrl}/call-offs/import-text`, {
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
    const response = await fetch(`${apiUrl}/call-offs/import-pdf`, {
      method: "POST",
      body: upload,
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
      scope: scope(formData),
      schedule: optionalText(formData.get("schedule")),
      onCall: formData.get("onCall") === "true" ? true : formData.get("onCall") === "false" ? false : null,
      introduction: optionalText(formData.get("introduction")),
      mandatoryRequirements: lines(formData.get("mandatoryRequirements")),
      preferences: lines(formData.get("preferences")),
      criteria: lines(formData.get("criteria")),
      priorities: lines(formData.get("priorities")),
      commercialTerms: optionalText(formData.get("commercialTerms")),
      submissionDeadline: optionalText(formData.get("submissionDeadline")),
      otherTerms: lines(formData.get("otherTerms")),
    });
    const response = await fetch(`${apiUrl}/call-offs/reviews/${extractionId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!response.ok) throw new Error(await responseError(response));
    destination = `/?review=${extractionId}&success=${encodeURIComponent("CallOff godkänd och sparad")}`;
  } catch (error) {
    destination = `/?review=${extractionId}&${errorQuery(error)}`;
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
    email: optionalText(formData.get("requesterEmail")),
  };
  return Object.values(result).every((value) => value === null) ? null : result;
}

function scope(formData: FormData) {
  const count = optionalText(formData.get("consultantCount"));
  const description = optionalText(formData.get("scopeDescription"));
  if (count === null && description === null) return null;
  return { consultantCount: count === null ? null : Number(count), description };
}

function errorDestination(error: unknown) {
  return `/?${errorQuery(error)}`;
}

function errorQuery(error: unknown) {
  return `error=${encodeURIComponent(error instanceof Error ? error.message : "Okänt fel")}`;
}
