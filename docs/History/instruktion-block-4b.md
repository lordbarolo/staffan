# Instruktion: Block 4b — resten av block 4

*Klistra in allt nedanför linjen i Agent Architect-chatten.*

---

## Uppgift: Block 4b — fullföljande, deduplicering, integrationslager

Du är Agent Architect (nivå 2) i projektet "Världens bästa agent". Läs följande i projektet innan du börjar, i denna ordning:

1. `claude/master-specification-v0.5.md` — source of truth. Vid konflikt gäller den.
2. `claude/arkitekturspecifikation-agentlager-v0.10.md` — arbetets tillstånd. Endast senaste versionen är giltig; bygg aldrig på en arkiverad version.
3. `claude/block-4a-data-minne-profil-tenant.md` — block 4a, levererat som fristående parallelleverans.
4. `claude/instruktion-agent-architect-v1.1.md` — arbetsform och designmetod.
5. `claude/beslutslogg-delegerat.md` — delegerade beslut som gäller som premisser.

**Block 4 delades i två halvor.** Block 4a (trösklar, minne, profil, samtycke, tenant-golv) är levererat och kördes parallellt med block 3. Block 4b är den halva som var låst av förhandlingsarkitekturen. Din uppgift är block 4b.

### Utgångsläge

Block 3 är beslutat (A-012, §13 i v0.10). Block 4b kan därför köras i sin helhet. Bygg på §13:s beslutade begrepp i stället för att införa nya:

- **Avslutstillstånden** (§13.1): *bekräftat | avböjt | avbrutet | förfallet*, plus *parkerad*.
- **Kanoniska händelseschemat** (§13.2) — all attribution ska kunna avläsas ur händelseströmmen.
- **Handlingstyp 31** (§13.10, A-012): allt avbrott bekräftas av konsulten.
- **Tystnadstrappan** T1/T2/T3 = 2/4/10 arbetsdagar och budens synliga giltighetstid (§13.9).

Två av avslutstillstånden är redan attributionsneutrala och ska behandlas så: *avbrutet* kräver konsultens bekräftelse och kan därför aldrig räknas mot motparten; *förfallet* beror på vem som teg, vilket tystnadstrappan gör avläsbart. Om du tycker att den slutsatsen inte bär — säg det, designa inte runt den.

### Omfattning

**Del 1 — Fullföljandehändelser.** A-003 Tillägg 1 satte fullföljandefaktorn i skuggläge tills händelsedefinitioner med undantagskategorier och verifierad datakvalitet finns. Besvara:

- Vilka händelser konstituerar "fullföljande till avtal", uttryckta i §13.1:s avslutstillstånd? *Bekräftat* är uppenbart fullföljande — men vad gör *avböjt*, och vad gör ett kandidatresultat som aldrig omvandlades till bekräftat?
- Undantagskategorierna: när ska ett uteblivet fullföljande *inte* räknas mot motparten? Konsulten tackade nej, vårdgivaren drog uppdraget, konsulten blev förhindrad, villkoren ändrades av konsultsidan — och vad mer.
- Attributionen: kan orsaken bestämmas deterministiskt ur händelseströmmen, eller kräver den bedömning? Om bedömning krävs — var bor den, givet att AP-003 förbjuder modellen att vara den som avgör ett värde som ska ha effekt?
- Beräkningsfönster och åldrande. D-004:s 36-månadersfönster är en möjlig analogi; motivera valet.
- Minsta underlag innan en aktörs fullföljandegrad visas. Använd block 4a:s tröskelresonemang — men observera att det här skyddar en *aktör*, inte en individ, vilket är en annan avvägning.
- Exitkriteriet ur skuggläget: gör "verifierad datakvalitet" till något mätbart.
- Effektfrågan: A-003 Tillägg 2 säger att automatisk effekt endast kan läggas i deterministisk logik i verkställighetslagret, kopplat till AQ-006 (som är öppen och återupptas i block 5). Redovisa exakt vilken effekt som *skulle* vara möjlig — besluta den inte.
- **Motpartsrättvisan:** får en aktör se sin egen fullföljandegrad, och kan den bestrida en attribution? Att vikta ned en motpart på data den inte får se är en svag position både kommersiellt och mot D-015:s "samma villkor". Ta ställning.

**Del 2 — Deduplicering (D-009).** Kärnfunktion, och förutsättning för §11:s värdebaserade prissättning. Besvara:

- Matchningslogiken: vilka signaler identifierar samma underliggande *Uppdrag* via flera *Erbjudandevägar*? Vårdgivare, enhet, ort, roll, period, omfattning, ramavtals- eller DIS-referens — och deras relativa vikt.
- Deterministisk eller sannolikhetsbaserad matchning? A-002m säger att osäker dedup visas som två med flagga; specificera tröskeln för säker sammanslagning och hur gråzonen presenteras.
- Var körs matchningen? Per A-001 bör det vara en deterministisk pipeline, inte huvudagenten. Motivera.
- AP-003-prövningen: dedupliceringsresultatet påverkar vad konsulten ser. A-002d förbjuder filtrering — allt visas i ankomstordning. Visa att dedup är *presentation*, inte urval, och att inget rekommendationsförbjudet värde smyger in via dedup-vägen.
- Konsultens korrigering: kan konsulten slå ihop eller isär manuellt, och blir korrigeringen inlärning eller enbart en lokal åsidosättning?
- Granskbarhet mot utbudssidan: §11:s prislogik bygger på dedup ("ett femte bolag med samma ramavtal adderar mindre"). Hur kan den beräkningen visas för en aktör utan att exponera andra aktörers villkor?

**Del 3 — Integrationslagret (D-011, A-009, A-007).** Två integrationsbehov som inte får blandas ihop:

- **(a) Inkommande marknadsdata** — 36 mån avropsdata från ~290 kommuner och 21 regioner (A-007), SKR-priser, BEGA-historik. D-011 håller medvetet öppet var datan bor; lås inte det, definiera gränssnittet. Varje datapunkt måste bära källa och färskhet, eftersom Agentbeslut-objektet kräver det (§12.6).
- **(b) Motpartskanaler** — API, strukturerad e-post, fri e-post (A-009). Gemensamt internt objekt, kanalspecifika adaptrar. Spänning 2 kräver att fallbacken är likvärdig i kvalitet, inte en teoretisk reservutgång — visa att den är det.
- Allt inkommande passerar dokumentarbetarnas schematvång och karantän (§5.3, A-007). Inga undantag för "betrodda" källor.
- Avropsdata och ramavtalsdata hålls fysiskt åtskilda enligt block 4a §1.

**Del 4 — Utbytesdeduplicering.** Hur förhindras att konsulten via två erbjudandevägar konkurrerar mot sig själv om samma underliggande Uppdrag? Koppla till A-003:s budgivningsmodell och AP-002.

### Arbetsform

Leverera **ett komplett, sammanhängande förslag** — inte fragment. Inkludera:

- uttalade antaganden med mätning och reträtt (AA-001–AA-005 är upptagna; numrera från AA-006)
- bortvalda alternativ med skäl
- vilka spänningar blocket berör (Överlämningsunderlaget §5)
- eventuella eskaleringar till nivå 1 (AQ-008 är upptagen av block 4a; numrera från AQ-009)

Vid beslut konsolideras blocket till **A-014** (A-013 är reserverat för block 4a). Använd samma dokumentdisciplin som block 4a: fristående dokument som vävs in i arkitekturspecifikationens nästa version.

### Discipliner

- Varje beslut ska ha en giltig härledning ur Master Specification v0.5, angiven med ID. Ändra ingenting i Master Specification.
- Block 4a:s beslut och de delegerade besluten i beslutsloggen är **premisser**. Upptäcker du att något av dem inte bär — säg det uttryckligen i stället för att designa runt det.
- **Delegationsregeln gäller:** fatta beslut åt Anders utan att fråga när beslutet följer av en befintlig princip, kan ändras utan att kod eller data byggs om, inte exponerar persondata mot ny part och inte binder mot tredje man. Skriv "antaget:" framför sådana beslut och logga dem i `claude/beslutslogg-delegerat.md` med vad de följer av och vilken fråga Anders annars hade fått. Fråga bara när beslutet är irreversibelt, kostar pengar, exponerar persondata mot ny part, ändrar positionering eller lojalitetslöfte, eller faller mellan två principer som pekar åt olika håll.
- Luckor i Master Specification eskaleras till nivå 1 som konkreta frågor — de designas inte bort.
- Kvalitetskontroll och handoff-brief ska göras vid beslut 20 (rangordnade antaganden, svagast motiverade beslut). Kontrollera var beslutsräkningen står och gör den om den infaller i detta block.
