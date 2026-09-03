import { getHealth } from "./health";
import { approveCallOff, importPdf, importText } from "./actions";

interface Review {
  artifact: {
    content: string;
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
  const [health, query] = await Promise.all([getHealth(), searchParams]);
  const review = query.review === undefined ? null : await getReview(query.review);

  return (
    <main>
      <header>
        <p className="eyebrow">Staffan</p>
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
          <h2 id="new-calloff">Text eller PDF</h2>
        </div>
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

      {review === null ? null : <ReviewPanel review={review} />}
    </main>
  );
}

function ReviewPanel({ review }: { review: Review }) {
  const values = review.extraction.extraction;
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
          <Field name="sourceSystem" label="Källsystem" value={value(values, "sourceSystem")} required />
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
            <Field name="periodStart" label="Startdatum" type="date" value={value(values, "periodStart")} required />
            <Field name="periodEnd" label="Slutdatum" type="date" value={value(values, "periodEnd")} required />
          </div>
          <div className="two-columns">
            <Field name="consultantCount" label="Antal konsulter" type="number" value={nestedValue(values, "scope", "consultantCount")} />
            <Field name="scopeDescription" label="Omfattning" value={nestedValue(values, "scope", "description")} required />
          </div>
          <TextArea name="schedule" label="Schema" value={value(values, "schedule")} required />
          <label>Jour/beredskap<select name="onCall" defaultValue={booleanValue(values, "onCall")}><option value="">Okänt</option><option value="true">Ja</option><option value="false">Nej</option></select></label>
          <TextArea name="introduction" label="Introduktion" value={value(values, "introduction")} />
          <TextArea name="competenceRequirements" label="Kompetenskrav, ett per rad" value={linesValue(values, "competenceRequirements")} />
          <TextArea name="mandatoryRequirements" label="Obligatoriska krav, ett per rad" value={linesValue(values, "mandatoryRequirements")} />
          <TextArea name="preferences" label="Önskemål, ett per rad" value={linesValue(values, "preferences")} />
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

function Field({ label, name, required = false, type = "text", value: initialValue }: { label: string; name: string; required?: boolean; type?: string; value: string }) {
  return <label>{label}<input name={name} type={type} defaultValue={initialValue} required={required} /></label>;
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

async function getReview(id: string): Promise<Review | null> {
  try {
    const apiUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";
    const response = await fetch(`${apiUrl}/call-offs/reviews/${id}`, { cache: "no-store" });
    return response.ok ? (await response.json()) as Review : null;
  } catch {
    return null;
  }
}
