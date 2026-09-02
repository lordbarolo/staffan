# Nivå 1:s svar på Leverans 1 (AQ-001–AQ-005)

**Från:** Master Spec-processen (Nivå 1)
**Till:** Agent Architect (Nivå 2)
**Datum:** 2026-08-15
**Gäller:** Master Specification v0.5 (som ersätter v0.4 och innehåller besluten nedan i full form, §8)

## Verdikt över Leverans 1

Godkänd utan anmärkning. Särskilt noterat och bekräftat av nivå 1: läsningen av §12:s "ska inte kunna" som krav på teknisk spärr utanför agenternas omdöme är korrekt och avsedd; informationsförbudet (rangordningslogiken får inte ha åtkomst till betalnings- och ägardata) är rätt operationalisering av P-008/P-010; skärpningen om profilfältsspårbarhet godkänns inom nivå 2:s mandat. Fortsätt till Leverans 2.

## Beslut

**AQ-001 → D-023.** Ingen motpartsyta i v1. Allt utbyte via motpartens befintliga kanaler (strukturerad e-post, API där det finns, DIS). "Ansluten pilot" = integrationsöverenskommelse på dataplanet. Krav: tenant-modellen rymmer framtida motpartsytor utan ombyggnad — vårdgivare blir första externa ytan (SmartPool, D-021, inom 12 månader), före bemanningsföretag. Designa så att båda bärs.

**AQ-002 → P-013 (ny princip, fast kärna).** Öppet ombudskap: agenten agerar alltid öppet som konsultens ombud gentemot externa parter — uppträder aldrig som konsulten själv, i någon kanal, inklusive mänsklig fallback.

**AQ-003 → D-024.** Granskbarhetens publik: (1) konsulten i produkten, per beslut — "visa underlaget" inklusive kända erbjudandevägar och motivering av valet; (2) tredjepartsgranskningsbar per konstruktion — loggschema och separation utformas så att extern granskare kan verifiera neutraliteten; själva revisionen är affärsbeslut på tillväxtytan, inte lanseringskrav. Offentlig reproducerbarhet avvisas. Lanseringskravet uppfylls av (1) + strukturen i (2).

**AQ-004 → D-025.** Ett opt-in-samtycke som uttryckligen omfattar även härledd data (förhandlingsutfall, accepterade ersättningsnivåer) under samma snäva ändamål (D-020). Aldrig tyst inkludering: samtyckestexten namnger härledd data, och konsulten kan alltid se exakt vilka datapunkter som delats. Inga separata samtycken per kategori.

**AQ-005 → D-026.** Din tolkning bekräftas: reproducerbarhet = varje Agentbeslut loggas med fullständigt underlag (datapunkter, modellversion, antaganden, motivering, kända alternativ) så att beslutet kan prövas i efterhand — inte bitvis återkörning. Option (ej krav): deterministiskt rangordningssteg på loggade indata, så att neutralitetens kritiska steg blir återkörbart.

---

*Versionsnotering: v0.4 är arkiverad enligt versionshanteringsregeln. Source of truth är Master Specification v0.5.*
