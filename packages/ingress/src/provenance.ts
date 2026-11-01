import { callOffFieldsSchema, type CallOffExtraction, type RawArtifact } from "@staffan/core";

// Source text is untrusted. Never echo rejected keys or excerpts into diagnostics.
export function checkProvenance(extraction: CallOffExtraction, artifact: RawArtifact) {
  const issues: string[] = [];
  let invalid = false;
  for (const [field, sources] of Object.entries(extraction.fieldProvenance)) {
    if (!Object.hasOwn(callOffFieldsSchema.shape, field)) {
      issues.push("fieldProvenance: Okänt fält i källhänvisning");
      invalid = true;
      continue;
    }
    for (const source of sources) {
      if (source.artifactId !== artifact.id || source.excerpt.trim() === "" ||
          !artifact.content.includes(source.excerpt)) {
        issues.push(`${field}: Källhänvisningen saknar ett ordagrant citat i den aktuella råkällan`);
        invalid = true;
        break;
      }
    }
  }
  for (const field of Object.keys(callOffFieldsSchema.shape)) {
    const value = extraction[field as keyof typeof callOffFieldsSchema.shape];
    if (field === "sourceSystem" || (field === "externalRef" && artifact.externalRef !== null) ||
        value === null || (Array.isArray(value) && value.length === 0)) continue;
    if (!Object.hasOwn(extraction.fieldProvenance, field)) {
      issues.push(`${field}: Källhänvisning saknas; kontrollera värdet manuellt mot råkällan`);
    }
  }
  return { invalid, issues };
}
