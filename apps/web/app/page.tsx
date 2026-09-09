import { getHealth } from "./health";
import { approveCallOff, importEavrop, importPdf, importText } from "./actions";
import { authenticatedApiFetch, requireOperator } from "./auth";
import { logout } from "./session-actions";

interface Discovery {
  attemptCount: number;
  externalRef: string | null;
  extractionId: string | null;
  id: string;
  lastError: string | null;
  leaseExpiresAt: string | null;
  status: "discovered" | "queued" | "processing" | "in_review" | "failed";
  updatedAt: string;
}

interface Review {
  artifact: {
    content: string;
    externalRef: string | null;
    fileName: string | null;
  };
  extraction: {
    id: string;
    extraction: Record<string, unknown> | null;
    issues: string[];
    model: { name: string; version: string };
    status: "ready_for_review" | "failed";
  };
}

export const dynamic = "force-dynamic";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; review?: string; success?: string }>;
}) {
  const operator = await requireOperator();
  const [health, query, reviews, discoveries] = await Promise.all([
    getHealth(),
    searchParams,
    getReviews(),
    getDiscoveries(),
  ]);
  const review = query.review === undefined ? null : await getReview(query.review);

  return (
    <main>
      <header>
        <div className="operator-bar">
          <p className="eyebrow">Staffan · {operator.username}</p>
          <form action={logout}><button className="secondary-button" type="submit">Logga ut</button></form>
        </div>
        <h1>Avropsintag</h1>
        <p className="intro">Importera ett avrop, granska källan mot extraktionen och godkänn först när obligatoriska fält är korrekta.</p>
      </header>

      <section className="status-card" aria-labelledby="systemstatus">
        <div>
          <p className="eyebrow">Systemstatus</p>
          <h2 id="systemstatus">Körbar ryggrad</h2>
        </div>
        <p className={health.available ? "status status-ok" : "status status-error"}>
          <span aria-hidden="true" />
          {health.available ? "API och databas är tillgängliga" : health.message}
        </p>
      </section>

      {query.error === undefined ? null : <p className="notice notice-error">{query.error}</p>}
      {query.success === undefined ? null : <p className="notice notice-ok">{query.success}</p>}

      <section className="intake" aria-labelledby="new-calloff">
        <div>
          <p className="eyebrow">Nytt underlag</p>
          <h2 id="new-calloff">e-Avrop, text eller PDF</h2>
        </div>
        <form action={importEavrop} className="portal-form">
          <label>e-Avrop-länk<input name="url" type="url" placeholder="https://www.e-avrop.com/..." required /></label>
          <button type="submit">Hämta från e-Avrop</button>
          <small>Staffan loggar in, hämtar avropstext och bilagor och skickar materialet till samma granskning som övriga källor.</small>
        </form>
        <form action={importText}>
          <label>Extern referens<input name="externalRef" /></label>
          <label>Inklistrad avropstext<textarea name="content" rows={9} required /></label>
          <button type="submit">Extrahera text</button>
        </form>
        <form action={importPdf} className="pdf-form">
          <label>PDF-underlag<input name="file" type="file" accept="application/pdf" required /></label>
          <button type="submit">Extrahera PDF</button>
        </form>
      </section>

      <section className="intake" aria-labelledby="review-queue">
        <div>
          <p className="eyebrow">Granskningskö</p>
          <h2 id="review-queue">Nya och manuella avrop</h2>
        </div>
        {reviews.length === 0 ? (
          <p>Inga avrop väntar på granskning.</p>
        ) : (
          <ul className="queue-list">
            {reviews.slice(0, 20).map((item) => (
              <li key={item.extraction.id}>
                <a href={`/?review=${item.extraction.id}`}>
                  {item.artifact.fileName ?? item.artifact.externalRef ?? "Avrop utan referens"}
                </a>
                <span>
                  {item.extraction.status === "failed" ? "Extraktionsfel" : "Manuell granskning"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {discoveries.length === 0 ? null : (
          <details>
            <summary>Bakgrundshämtning ({discoveries.length})</summary>
            <ul className="queue-list">
              {discoveries.slice(0, 20).map((item) => (
                <li key={item.id}>
                  {item.extractionId === null ? (
                    <span>{item.externalRef ?? "Avrop utan referens"}</span>
                  ) : (
                    <a href={`/?review=${item.extractionId}`}>
                      {item.externalRef ?? "Avrop utan referens"}
                    </a>
                  )}
                  <span>
                    {discoveryStatusLabel[item.status]} · försök {item.attemptCount}
                  </span>
                  {item.lastError === null ? null : <small>{item.lastError}</small>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {review === null ? null : <ReviewPanel review={review} />}
    </main>
  );
}

function ReviewPanel({ review }: { review: Review }) {
  const values = review.extraction.extraction;
  const segments = periodSegmentsValue(values);
  const requirements = classifiedRequirementsValue(values);
  const hasSegmentPeriod = segments.some(
    (segment) =>
      (segment.periodStart !== null && segment.periodEnd !== null) || segment.workWeeks.length > 0,
  );
  const hasSegmentSchedule = segments.some((segment) => segment.schedule !== null);
  return (
    <section className="review" aria-labelledby="review-heading">
      <div className="review-heading">
        <div>
          <p className="eyebrow">Manuell kontroll</p>
          <h2 id="review-heading">Källa och extraktion</h2>
        </div>
        <span className={`status ${review.extraction.status === "failed" ? "status-error" : "status-ok"}`}>
          {review.extraction.status === "failed" ? "Extraktion misslyckades" : "Klar för granskning"}
        </span>
      </div>
      {review.extraction.issues.length === 0 ? null : (
        <div className="issues"><strong>Att åtgärda</strong><ul>{review.extraction.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>
      )}
      <div className="review-grid">
        <article>
          <h3>Råkälla {review.artifact.fileName === null ? "" : `– ${review.artifact.fileName}`}</h3>
          <pre>{review.artifact.content}</pre>
        </article>
        <form action={approveCallOff}>
          <input type="hidden" name="extractionId" value={review.extraction.id} />
          <Field name="externalRef" label="Extern referens" value={value(values, "externalRef")} />
          <Field name="sourceSystem" label="Källsystem" value={value(values, "sourceSystem")} readOnly required />
          <Field name="careProvider" label="Vårdgivare" value={value(values, "careProvider")} required />
          <Field name="organizationNumber" label="Organisationsnummer" value={value(values, "organizationNumber")} />
          <Field name="administration" label="Förvaltning" value={value(values, "administration")} />
          <Field name="unit" label="Enhet" value={value(values, "unit")} />
          <div className="two-columns">
            <Field name="requesterName" label="Beställare" value={nestedValue(values, "requester", "name")} />
            <Field name="requesterPhone" label="Beställarens telefon" value={nestedValue(values, "requester", "phone")} />
          </div>
          <TextArea name="requesterEmails" label="Beställarens e-post, en per rad" value={nestedLinesValue(values, "requester", "emails")} />
          <Field name="role" label="Roll" value={value(values, "role")} required />
          <Field name="specialty" label="Specialitet" value={value(values, "specialty")} />
          <Field name="location" label="Plats" value={value(values, "location")} required />
          <div className="two-columns">
            <Field name="periodStart" label="Startdatum" type="date" value={value(values, "periodStart")} required={!hasSegmentPeriod} />
            <Field name="periodEnd" label="Slutdatum" type="date" value={value(values, "periodEnd")} required={!hasSegmentPeriod} />
          </div>
          <PeriodSegmentsEditor segments={segments} />
          <div className="two-columns">
            <Field name="consultantCount" label="Antal konsulter" type="number" value={nestedValue(values, "scope", "consultantCount")} />
            <Field name="scopeDescription" label="Omfattning" value={nestedValue(values, "scope", "description")} required />
          </div>
          <TextArea name="schedule" label="Övergripande schema" value={value(values, "schedule")} required={!hasSegmentSchedule} />
          <label>Jour/beredskap<select name="onCall" defaultValue={booleanValue(values, "onCall")}><option value="">Okänt</option><option value="true">Ja</option><option value="false">Nej</option></select></label>
          <TextArea name="introduction" label="Introduktion" value={value(values, "introduction")} />
          <TextArea name="competenceRequirements" label="Kompetenskrav, ett per rad" value={linesValue(values, "competenceRequirements")} />
          <TextArea name="mandatoryRequirements" label="Obligatoriska krav, ett per rad" value={linesValue(values, "mandatoryRequirements")} />
          <TextArea name="preferences" label="Önskemål, ett per rad" value={linesValue(values, "preferences")} />
          <ClassifiedRequirementsEditor requirements={requirements} />
          <TextArea name="criteria" label="Kriterier, ett per rad" value={linesValue(values, "criteria")} />
          <TextArea name="priorities" label="Prioriteringar, ett per rad" value={linesValue(values, "priorities")} />
          <TextArea name="requiredDocuments" label="Bilagekrav, ett per rad" value={linesValue(values, "requiredDocuments")} />
          <TextArea name="commercialTerms" label="Kommersiella villkor" value={value(values, "commercialTerms")} />
          <Field name="submissionDeadline" label="Sista svarsdatum" type="date" value={value(values, "submissionDeadline")} required />
          <TextArea name="otherTerms" label="Övriga villkor, ett per rad" value={linesValue(values, "otherTerms")} />
          <button type="submit" disabled={values === null}>Godkänn CallOff</button>
          <small>Extraherad av {review.extraction.model.name} v{review.extraction.model.version}</small>
        </form>
      </div>
    </section>
  );
}

interface PeriodSegmentValue {
  label: string | null;
  onCall: boolean | null;
  periodEnd: string | null;
  periodStart: string | null;
  schedule: string | null;
  workWeeks: Array<{ week: number; year: number | null }>;
}

interface ClassifiedRequirementValue {
  category: string;
  evidenceRequired: string | null;
  level: "shall" | "should";
  text: string;
}

function PeriodSegmentsEditor({ segments }: { segments: PeriodSegmentValue[] }) {
  return (
    <fieldset className="structured-fields">
      <legend>Periodsegment och arbetsveckor</legend>
      <input type="hidden" name="periodSegmentCount" value={segments.length} />
      {segments.length === 0 ? (
        <small>Inga separata segment extraherades. Den övergripande perioden används.</small>
      ) : (
        segments.map((segment, index) => {
          const prefix = `periodSegment.${index}`;
          return (
            <div className="structured-row" key={`${segment.label ?? "segment"}-${index}`}>
              <Field name={`${prefix}.label`} label={`Segment ${index + 1}`} value={segment.label ?? ""} />
              <div className="two-columns">
                <Field name={`${prefix}.periodStart`} label="Startdatum" type="date" value={segment.periodStart ?? ""} />
                <Field name={`${prefix}.periodEnd`} label="Slutdatum" type="date" value={segment.periodEnd ?? ""} />
              </div>
              <TextArea
                name={`${prefix}.workWeeks`}
                label="Arbetsveckor, en per rad (ÅÅÅÅ-v eller v)"
                value={segment.workWeeks.map((week) => `${week.year === null ? "" : `${week.year}-`}${week.week}`).join("\n")}
              />
              <TextArea name={`${prefix}.schedule`} label="Schema för segmentet" value={segment.schedule ?? ""} />
              <label>Jour/beredskap för segmentet<select name={`${prefix}.onCall`} defaultValue={segment.onCall === null ? "" : String(segment.onCall)}><option value="">Okänt</option><option value="true">Ja</option><option value="false">Nej</option></select></label>
            </div>
          );
        })
      )}
    </fieldset>
  );
}

function ClassifiedRequirementsEditor({
  requirements,
}: {
  requirements: ClassifiedRequirementValue[];
}) {
  return (
    <fieldset className="structured-fields">
      <legend>Klassificerade ska- och börkrav</legend>
      <input type="hidden" name="classifiedRequirementCount" value={requirements.length} />
      {requirements.length === 0 ? (
        <small>Inga strukturerade krav extraherades. Kontrollera listorna ovan.</small>
      ) : (
        requirements.map((requirement, index) => {
          const prefix = `classifiedRequirement.${index}`;
          return (
            <div className="structured-row" key={`${requirement.level}-${requirement.text}-${index}`}>
              <div className="two-columns">
                <label>Nivå<select name={`${prefix}.level`} defaultValue={requirement.level}><option value="shall">Ska-krav</option><option value="should">Börkrav</option></select></label>
                <label>Kategori<select name={`${prefix}.category`} defaultValue={requirement.category}>{requirementCategoryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              </div>
              <TextArea name={`${prefix}.text`} label="Krav" value={requirement.text} required />
              <TextArea name={`${prefix}.evidenceRequired`} label="Efterfrågat bevis" value={requirement.evidenceRequired ?? ""} />
            </div>
          );
        })
      )}
    </fieldset>
  );
}

const requirementCategoryOptions = [
  ["professional_license", "Legitimation"],
  ["specialist_competence", "Specialistkompetens"],
  ["clinical_experience", "Klinisk erfarenhet"],
  ["system_experience", "Systemvana"],
  ["language", "Språk"],
  ["availability", "Tillgänglighet"],
  ["documentation", "Dokumentation"],
  ["commercial", "Kommersiellt"],
  ["other", "Övrigt"],
] as const;

const discoveryStatusLabel: Record<Discovery["status"], string> = {
  discovered: "Upptäckt",
  queued: "Köad",
  processing: "Bearbetas",
  in_review: "Manuell granskning",
  failed: "Kräver åtgärd",
};

function Field({ label, name, readOnly = false, required = false, type = "text", value: initialValue }: { label: string; name: string; readOnly?: boolean; required?: boolean; type?: string; value: string }) {
  return <label>{label}<input name={name} type={type} defaultValue={initialValue} readOnly={readOnly} required={required} /></label>;
}

function TextArea({ label, name, required = false, value: initialValue }: { label: string; name: string; required?: boolean; value: string }) {
  return <label>{label}<textarea name={name} rows={3} defaultValue={initialValue} required={required} /></label>;
}

function value(record: Record<string, unknown> | null, key: string) {
  const current = record?.[key];
  return typeof current === "string" ? current : "";
}

function linesValue(record: Record<string, unknown> | null, key: string) {
  const current = record?.[key];
  return Array.isArray(current) ? current.filter((item): item is string => typeof item === "string").join("\n") : "";
}

function booleanValue(record: Record<string, unknown> | null, key: string) {
  const current = record?.[key];
  return typeof current === "boolean" ? String(current) : "";
}

function nestedValue(record: Record<string, unknown> | null, key: string, nestedKey: string) {
  const current = record?.[key];
  if (typeof current !== "object" || current === null) return "";
  const nested = (current as Record<string, unknown>)[nestedKey];
  return typeof nested === "string" || typeof nested === "number" ? String(nested) : "";
}

function nestedLinesValue(record: Record<string, unknown> | null, key: string, nestedKey: string) {
  const current = record?.[key];
  if (typeof current !== "object" || current === null) return "";
  const nested = (current as Record<string, unknown>)[nestedKey];
  return Array.isArray(nested) ? nested.filter((item): item is string => typeof item === "string").join("\n") : "";
}

function periodSegmentsValue(record: Record<string, unknown> | null): PeriodSegmentValue[] {
  const current = record?.periodSegments;
  return Array.isArray(current) ? (current as PeriodSegmentValue[]) : [];
}

function classifiedRequirementsValue(
  record: Record<string, unknown> | null,
): ClassifiedRequirementValue[] {
  const current = record?.classifiedRequirements;
  return Array.isArray(current) ? (current as ClassifiedRequirementValue[]) : [];
}

async function getReview(id: string): Promise<Review | null> {
  try {
    const response = await authenticatedApiFetch(`/call-offs/reviews/${id}`, { cache: "no-store" });
    return response.ok ? (await response.json()) as Review : null;
  } catch {
    return null;
  }
}

async function getReviews(): Promise<Review[]> {
  try {
    const response = await authenticatedApiFetch("/call-offs/reviews", { cache: "no-store" });
    return response.ok ? (await response.json()) as Review[] : [];
  } catch {
    return [];
  }
}

async function getDiscoveries(): Promise<Discovery[]> {
  try {
    const response = await authenticatedApiFetch("/call-offs/discoveries", { cache: "no-store" });
    return response.ok ? (await response.json()) as Discovery[] : [];
  } catch {
    return [];
  }
}
