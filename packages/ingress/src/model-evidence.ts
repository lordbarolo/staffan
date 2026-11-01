import type { CallOffExtraction } from "@staffan/core";

export function indexEvidenceSources(content: string) {
  const sources = new Map<string, string>();
  // Preserve exact source substrings and stay below the domain's 500-character
  // quote limit, including long spreadsheet rows and unbroken PDF paragraphs.
  for (const line of content.split(/\r?\n/)) {
    for (let offset = 0; offset < line.length; offset += 400) {
      const excerpt = line.slice(offset, offset + 400).trim();
      if (excerpt !== "") sources.set(`S${sources.size + 1}`, excerpt);
    }
  }
  return sources;
}

export function bindModelEvidence(
  evidence: Array<{ field: string; confidence: number; sources: Array<{ sourceId: string }> }>,
  sources: ReadonlyMap<string, string>,
  artifactId: string,
): Pick<CallOffExtraction, "fieldConfidence" | "fieldProvenance"> {
  const seen = new Set<string>();
  const entries = evidence.map((entry) => {
    if (seen.has(entry.field) || entry.sources.length === 0) {
      throw new Error("Modellen returnerade dubbla eller tomma källhänvisningar");
    }
    seen.add(entry.field);
    const bound = entry.sources.map(({ sourceId }) => {
      const excerpt = sources.get(sourceId);
      if (excerpt === undefined) {
        // Never include model-controlled identifiers or source data in errors.
        throw new Error("Modellen hänvisade till ett okänt källstycke");
      }
      return { artifactId, excerpt, locator: `Källstycke ${sourceId}` };
    });
    return { ...entry, bound };
  });
  return {
    fieldConfidence: Object.fromEntries(entries.map(({ field, confidence }) => [field, confidence])),
    fieldProvenance: Object.fromEntries(entries.map(({ field, bound }) => [field, bound])),
  };
}
