import type { CallOffExtraction } from "@staffan/core";

// Avidentifierad text härledd från det kommunala PDF-underlaget. Kommunens
// sakuppgifter är kvar; person- och leverantörsuppgifter är syntetiska.
export const eslovPageOneText = `Avropsförfrågan Sjuksköterska - Eslövs kommun
För denna avropsförfrågan gäller villkor i ramavtal Bemanningstjänster avseende sjuksköterskor samt arbets- och fysioterapeuter VOO 2024/178.
Samtliga krav på tjänsten i avtalsvillkoren gäller vid varje avrop.
Uppdraget tilldelas den leverantör som är rangordnad högst och uppfyller ställda kompetenskrav.
Ifylls av Kund:
Beställare: Eslövs kommun
Enhet: Sjuksköterskeenheten
Uppdragsadress: Kvarngatan 7 24139 Eslöv
Telefon: 000-000 00 00
E-post: bestallare1@example.invalid bestallare2@example.invalid
Datum: 250307
Ikryssade kompetenskrav gäller för uppdraget:
X En och samma konsult offereras för uppdraget (kontinuitet)
X Schemalagd arbetstid i uppdraget enligt bifogad blankett
X Körkort B för manuellt växlad personbil
X Sjuksköterska kan cykla
X Utbildning/erfarenhet hemsjukvård inom SÄBO/korttidsboende
X Utbildning/erfarenhet inom LSS
X Utbildning/erfarenhet hemsjukvård inom distrikt
Startdatum (inställelsedag): 250623
Slutdatum: 250810
Beskrivning av uppdrag: Arbeta på SÄBO med sedvanliga SSK-uppgifter
Avropssvar från leverantör till kund senast: 250319`;

export const eslovFullText = `${eslovPageOneText}

Ifylls av leverantören:
Företag: Testleverantör AB
Kontaktperson: Testkontakt
Namn på erbjuden konsult: Testkonsult A och Testkonsult B
Båda konsulter kan arbeta hela perioden
Ange pris/timme enligt avtal: SEK 799,50
Ange totalt antal timmar för uppdraget: 280h
Observera att CV, referenser, utdrag av belastningsregister, bevis på giltig legitimation samt dokumentation avseende utförd kontroll hos IVO och Socialstyrelsen för aktuell sjuksköterska ska bifogas av leverantören vid varje avropssvar.

Schemalagd arbetstid enligt avropet
Ifylls av beställare:
Schema kommer senare, det är 100%, arbete var 3:e helg, merparten på dagen men det kan finnas några kvällspass.
Ifylls av leverantör:
Namn på erbjuden konsult: Testkonsult A och Testkonsult B`;

export function expectedEslovExtraction(artifactId: string, completeDocument: boolean): CallOffExtraction {
  const provenance = (excerpt: string, locator: string) => [{ artifactId, excerpt, locator }];
  return {
    externalRef: null,
    sourceSystem: "pdf-upload",
    careProvider: "Eslövs kommun",
    organizationNumber: null,
    administration: null,
    unit: "Sjuksköterskeenheten",
    requester: {
      name: "Eslövs kommun",
      phone: "000-000 00 00",
      emails: ["bestallare1@example.invalid", "bestallare2@example.invalid"],
    },
    role: "Sjuksköterska",
    specialty: null,
    competenceRequirements: [
      "Utbildning eller erfarenhet av hemsjukvård inom SÄBO/korttidsboende",
      "Utbildning eller erfarenhet inom LSS",
      "Utbildning eller erfarenhet av hemsjukvård inom distrikt",
    ],
    location: "Kvarngatan 7, 241 39 Eslöv",
    periodStart: "2025-06-23",
    periodEnd: "2025-08-10",
    scope: completeDocument ? { consultantCount: 1, description: "100 procent" } : null,
    schedule: completeDocument
      ? "100 procent, arbete var tredje helg, huvudsakligen dagtid med möjlighet till vissa kvällspass"
      : "Schemalagd arbetstid enligt bifogad blankett",
    onCall: null,
    introduction: null,
    mandatoryRequirements: [
      "En och samma konsult ska offereras för uppdraget (kontinuitet)",
      "Schemalagd arbetstid enligt bifogad blankett",
      "Körkort B för manuellt växlad personbil",
      "Sjuksköterskan ska kunna cykla",
      "Utbildning eller erfarenhet av hemsjukvård inom SÄBO/korttidsboende",
      "Utbildning eller erfarenhet inom LSS",
      "Utbildning eller erfarenhet av hemsjukvård inom distrikt",
      "Samtliga tillämpliga krav i ramavtal VOO 2024/178",
    ],
    preferences: [],
    criteria: [
      "Uppdraget tilldelas högst rangordnad leverantör som uppfyller ställda kompetenskrav",
    ],
    priorities: [],
    requiredDocuments: completeDocument
      ? [
          "CV",
          "Referenser",
          "Utdrag ur belastningsregistret",
          "Bevis på giltig legitimation",
          "Dokumentation av utförd kontroll hos IVO och Socialstyrelsen",
        ]
      : [],
    commercialTerms: null,
    submissionDeadline: "2025-03-19",
    otherTerms: [
      "Ramavtal Bemanningstjänster avseende sjuksköterskor samt arbets- och fysioterapeuter, VOO 2024/178",
      "Arbete på SÄBO med sedvanliga sjuksköterskeuppgifter",
    ],
    confidence: completeDocument ? 0.94 : 0.9,
    fieldConfidence: {
      externalRef: 0.2,
      careProvider: 0.99,
      organizationNumber: 0.1,
      unit: 0.99,
      requester: 0.96,
      role: 0.99,
      location: 0.99,
      periodStart: 0.98,
      periodEnd: 0.98,
      scope: completeDocument ? 0.88 : 0.1,
      schedule: completeDocument ? 0.99 : 0.85,
      mandatoryRequirements: 0.99,
      requiredDocuments: completeDocument ? 0.99 : 0.1,
      submissionDeadline: 0.98,
      commercialTerms: 0.2,
    },
    fieldProvenance: {
      careProvider: provenance("Beställare: Eslövs kommun", "sida 1, Ifylls av Kund"),
      unit: provenance("Enhet: Sjuksköterskeenheten", "sida 1, Ifylls av Kund"),
      requester: provenance("Telefon och två e-postadresser", "sida 1, Ifylls av Kund"),
      role: provenance("Avropsförfrågan Sjuksköterska", "sida 1, rubrik"),
      location: provenance("Kvarngatan 7 24139 Eslöv", "sida 1, Uppdragsadress"),
      periodStart: provenance("250623", "sida 1, Startdatum"),
      periodEnd: provenance("250810", "sida 1, Slutdatum"),
      scope: provenance(
        completeDocument ? "100%" : "En och samma konsult",
        completeDocument ? "sida 3, Ifylls av beställare" : "sida 1, ikryssat krav",
      ),
      schedule: provenance(
        completeDocument ? "arbete var 3:e helg, merparten på dagen, några kvällspass" : "enligt bifogad blankett",
        completeDocument ? "sida 3, Ifylls av beställare" : "sida 1, ikryssat krav",
      ),
      mandatoryRequirements: provenance("Ikryssade kompetenskrav", "sida 1"),
      ...(completeDocument
        ? {
            requiredDocuments: provenance(
              "CV, referenser, utdrag av belastningsregister, legitimation och kontroller",
              "sida 2, bilagekrav",
            ),
          }
        : {}),
      submissionDeadline: provenance("250319", "sida 1, Avropssvar senast"),
      criteria: provenance("rangordnad högst och uppfyller kompetenskrav", "sida 1"),
      otherTerms: provenance("VOO 2024/178", "sida 1, ramavtal"),
    },
  };
}
