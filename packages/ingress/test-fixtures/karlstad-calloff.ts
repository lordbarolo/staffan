import type { CallOffExtraction } from "@staffan/core";

// Avidentifierad, strukturellt trogen text härledd från det kommunala PDF-underlaget.
// Leverantörens konsultuppgifter på sida 2 ingår avsiktligt inte i CallOff-fixturen.
export const karlstadRawText = `Avropsförfrågan
Avropande myndighet Organisationsnummer
Karlstads kommun 212000-1850
Förvaltning Datum
Vård och omsorg Karlstads kommun 20260112
Enhet Anbud senast
Hälso-och sjukvård 20260125
Beställarens referensnummer/referenskod
Referenskod kommer att anges till respektive enhetsadministratör när placering är fastställd
Beställare Telefon e-postadress
Test Beställare 000-000 00 00 test@example.invalid
Avropet avser
Personalkategori
Legitimerad sjuksköterska
Antal 10 stycken
Arbetstider till största del förlagd dagtid enligt schema inklusive kväll- och helgtjänstgöring.
Placering på någon av kommunens stationer.
Under v. 23 planeras individuell introduktion. Detta betyder att man kanske inte har heltidsarbete under v. 23.
KONTINUITET PRIORITERAS dvs att antalet konsulter i uppdraget begränsas och samma ssk återkommer kontinuerligt under aktuell period.
Körkort krävs
Önskvärt cykelvana
För övrigt krav enligt gällande avtal
Tidsperiod
Startdatum 20260601
Slutdatum 20260816
Kriterier
Kontinuitet (samma person under efterfrågad tidsperiod)
Kan arbeta hela perioden`;

export function expectedKarlstadExtraction(artifactId: string): CallOffExtraction {
  const provenance = (excerpt: string, locator: string) => [{ artifactId, excerpt, locator }];
  return {
    externalRef: null,
    sourceSystem: "pdf-upload",
    careProvider: "Karlstads kommun",
    organizationNumber: "212000-1850",
    administration: "Vård och omsorg Karlstads kommun",
    unit: "Hälso- och sjukvård",
    requester: {
      name: "Test Beställare",
      phone: "000-000 00 00",
      email: "test@example.invalid",
    },
    role: "Legitimerad sjuksköterska",
    specialty: null,
    competenceRequirements: [],
    location: "Någon av Karlstads kommuns stationer",
    periodStart: "2026-06-01",
    periodEnd: "2026-08-16",
    scope: { consultantCount: 10, description: "10 konsulter" },
    schedule: "Till största del dagtid enligt schema, inklusive kvälls- och helgtjänstgöring",
    onCall: null,
    introduction: "Individuell introduktion planeras under vecka 23; heltidsarbete kan därför inte förutsättas under vecka 23.",
    mandatoryRequirements: ["Körkort krävs", "Övriga krav enligt gällande avtal"],
    preferences: ["Cykelvana är önskvärd"],
    criteria: [
      "Kontinuitet: samma person under efterfrågad tidsperiod",
      "Kan arbeta hela perioden",
    ],
    priorities: [
      "Kontinuitet prioriteras: begränsa antalet konsulter i uppdraget och låt samma sjuksköterskor återkomma kontinuerligt",
    ],
    commercialTerms: null,
    submissionDeadline: "2026-01-25",
    otherTerms: [
      "Beställarens referenskod anges till respektive enhetsadministratör när placeringen är fastställd",
    ],
    confidence: 0.91,
    fieldConfidence: {
      careProvider: 0.99,
      organizationNumber: 0.99,
      administration: 0.98,
      unit: 0.98,
      requester: 0.99,
      submissionDeadline: 0.94,
      role: 0.99,
      scope: 0.99,
      periodStart: 0.99,
      periodEnd: 0.99,
      schedule: 0.97,
      location: 0.94,
      introduction: 0.97,
      mandatoryRequirements: 0.96,
      preferences: 0.99,
      criteria: 0.97,
      priorities: 0.98,
      externalRef: 0.2,
      specialty: 0.35,
      onCall: 0.2,
      commercialTerms: 0.2,
    },
    fieldProvenance: {
      careProvider: provenance("Karlstads kommun", "sida 1, Avropande myndighet"),
      organizationNumber: provenance("212000-1850", "sida 1, Organisationsnummer"),
      administration: provenance("Vård och omsorg Karlstads kommun", "sida 1, Förvaltning"),
      unit: provenance("Hälso-och sjukvård", "sida 1, Enhet"),
      requester: provenance("Test Beställare 000-000 00 00 test@example.invalid", "sida 1, Beställare"),
      submissionDeadline: provenance("20260125", "sida 1, Anbud senast"),
      role: provenance("Legitimerad sjuksköterska", "sida 1, Personalkategori"),
      scope: provenance("Antal 10 stycken", "sida 1, Antal"),
      periodStart: provenance("Startdatum 20260601", "sida 1, Tidsperiod"),
      periodEnd: provenance("Slutdatum 20260816", "sida 1, Tidsperiod"),
      schedule: provenance("dagtid enligt schema inklusive kväll- och helgtjänstgöring", "sida 1, Arbetstider"),
      location: provenance("Placering på någon av kommunens stationer", "sida 1, Placering"),
      introduction: provenance("Under v. 23 planeras individuell introduktion", "sida 1, Introduktion"),
      mandatoryRequirements: provenance("Körkort krävs", "sida 1, Krav"),
      preferences: provenance("Önskvärt cykelvana", "sida 1, Önskemål"),
      criteria: provenance("Kan arbeta hela perioden", "sida 2, Kriterier"),
      priorities: provenance("KONTINUITET PRIORITERAS", "sida 1, Prioritering"),
      otherTerms: provenance("Referenskod kommer att anges", "sida 1, Referenskod"),
    },
  };
}
