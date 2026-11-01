import type { CallOffExtraction } from "@staffan/core";

export const anonymisedScannedCallOffOcr = `
Exempelköpings kommun söker sjuksköterska vecka 22-25 och 28-29
Plats: Testboendet, Exempelköping
Omfattning: en konsult
Period 1: 2027-05-31 till 2027-06-27, arbetsveckor 22, 23, 24, 25
Arbetstid: dag 07-16 inklusive helg
Period 2: 2027-07-12 till 2027-07-25, arbetsveckor 28, 29
Arbetstid: kväll 13-22
Sista svarsdag: 2027-04-30

Ska-krav
- Svensk sjuksköterskelegitimation. Bevis: kopia av legitimation.
- Minst två års klinisk erfarenhet. Bevis: uppdaterat CV.
- God svenska i tal och skrift.

Börkrav
- Erfarenhet av kommunal hälso- och sjukvård.
- Erfarenhet av journalsystemet ExempelJournal.
`;

export function expectedScannedCallOffExtraction(artifactId: string): CallOffExtraction {
  return {
    externalRef: null,
    sourceSystem: "pdf-upload",
    careProvider: "Exempelköpings kommun",
    organizationNumber: null,
    administration: null,
    unit: "Testboendet",
    requester: null,
    role: "Sjuksköterska",
    specialty: null,
    competenceRequirements: ["Svensk sjuksköterskelegitimation"],
    location: "Exempelköping",
    periodStart: null,
    periodEnd: null,
    periodSegments: [
      {
        label: "Period 1",
        periodStart: "2027-05-31",
        periodEnd: "2027-06-27",
        workWeeks: [22, 23, 24, 25].map((week) => ({ year: 2027, week })),
        schedule: "Dag 07-16 inklusive helg",
        onCall: null,
      },
      {
        label: "Period 2",
        periodStart: "2027-07-12",
        periodEnd: "2027-07-25",
        workWeeks: [28, 29].map((week) => ({ year: 2027, week })),
        schedule: "Kväll 13-22",
        onCall: null,
      },
    ],
    scope: { consultantCount: 1, description: "En konsult" },
    schedule: null,
    onCall: null,
    introduction: null,
    mandatoryRequirements: [
      "Svensk sjuksköterskelegitimation",
      "Minst två års klinisk erfarenhet",
      "God svenska i tal och skrift",
    ],
    preferences: [
      "Erfarenhet av kommunal hälso- och sjukvård",
      "Erfarenhet av journalsystemet ExempelJournal",
    ],
    classifiedRequirements: [
      {
        level: "shall",
        category: "professional_license",
        text: "Svensk sjuksköterskelegitimation",
        evidenceRequired: "Kopia av legitimation",
      },
      {
        level: "shall",
        category: "clinical_experience",
        text: "Minst två års klinisk erfarenhet",
        evidenceRequired: "Uppdaterat CV",
      },
      {
        level: "shall",
        category: "language",
        text: "God svenska i tal och skrift",
        evidenceRequired: null,
      },
      {
        level: "should",
        category: "clinical_experience",
        text: "Erfarenhet av kommunal hälso- och sjukvård",
        evidenceRequired: null,
      },
      {
        level: "should",
        category: "system_experience",
        text: "Erfarenhet av journalsystemet ExempelJournal",
        evidenceRequired: null,
      },
    ],
    criteria: [],
    priorities: [],
    requiredDocuments: ["Kopia av legitimation", "Uppdaterat CV"],
    commercialTerms: null,
    submissionDeadline: "2027-04-30",
    otherTerms: [],
    confidence: 0.9,
    fieldConfidence: { classifiedRequirements: 0.9, periodSegments: 0.94 },
    fieldProvenance: Object.fromEntries(
      Object.entries({
        careProvider: "Exempelköpings kommun",
        unit: "Testboendet",
        role: "sjuksköterska",
        competenceRequirements: "Svensk sjuksköterskelegitimation",
        location: "Plats: Testboendet, Exempelköping",
        periodSegments: "Period 1: 2027-05-31 till 2027-06-27, arbetsveckor 22, 23, 24, 25",
        scope: "Omfattning: en konsult",
        mandatoryRequirements: "Ska-krav",
        preferences: "Börkrav",
        classifiedRequirements: "Svensk sjuksköterskelegitimation. Bevis: kopia av legitimation.",
        requiredDocuments: "Bevis: kopia av legitimation.",
        submissionDeadline: "Sista svarsdag: 2027-04-30",
      }).map(([field, excerpt]) => [
        field,
        [{ artifactId, excerpt, locator: "OCR sida 1" }],
      ]),
    ),
  };
}
