# Strukturisani profil — Korak 6

Datum: 2026-10-06. Ugovor verzija 1, izvršni plan (private development record), odluke D-015/D-016 u DECISIONS (private development record). Prompt 6 i Master plan str. 15–17, 35–37 određuju ovaj sloj. [Zlatna pitanja](GOLDEN_QUESTIONS.md), [deset izvršivih razgovora](CONVERSATIONS.md), [verifikacija](VERIFICATION.md).

Implementiran je čist TypeScript/Zod domen, bez mreže, persistence-a ili modela. [schema.ts](../../src/features/profiles/schema.ts) definiše polja/događaje, [state.ts](../../src/features/profiles/state.ts) validirane transitions, [questions.ts](../../src/features/profiles/questions.ts) verzionisanu konfiguraciju, [engine.ts](../../src/features/profiles/engine.ts) pitanja/readiness. Stari `ProfileDraft` ostaje mali kompatibilni mock ugovor; Step 4 UI ima odvojeni statički fixture. Ovaj domen još nije povezan sa browser razgovorom; integracija ostaje Korak 9.

## Polja

Svih 27 polja postoji od početka sa `missing`, `value: null`; nema skrivenog podrazumevanog jezika, zemlje, budžeta, godine ili nule.

| Polje                  | Tip i značenje                                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| studyLevel             | undergraduate / master / phd.                                                                                                                                                                                        |
| fieldOfStudy           | Oblast, slobodna ograničena tekstualna vrednost.                                                                                                                                                                     |
| interests              | Lista interesovanja; prazna lista samo izričito data.                                                                                                                                                                |
| studyGoal              | Korisnikov obrazovni/profesionalni cilj.                                                                                                                                                                             |
| preferredCountries     | Jedinstveni kodovi destinacija Srbije/EU; prazno znači izričito bez preference.                                                                                                                                      |
| excludedCountries      | Jedinstveni kodovi destinacija Srbije/EU; missing nije isto što i nema isključenja.                                                                                                                                  |
| teachingLanguages      | Jedinstvena lista jezika nastave, trim/lowercase; ne izvodi se iz engleskog interfejsa.                                                                                                                              |
| budgetAmount           | Broj ≥ 0; nula samo ako korisnik izričito kaže nula. Tekst „10.000“ nije automatski parsiran.                                                                                                                        |
| budgetCurrency         | EUR / RSD / USD / GBP / CHF; nema podrazumevane valute ili konverzije.                                                                                                                                               |
| budgetPeriod           | month / year / total_degree; nema prećutne godišnje konverzije.                                                                                                                                                      |
| budgetIncludesLiving   | Boolean: true uključuje životne troškove, false tuition-only; null = nije poznato.                                                                                                                                   |
| scholarshipNeed        | required / preferred / not_needed. Nije dokaz dodeljene stipendije.                                                                                                                                                  |
| startYear              | Eksplicitna godina; prošla godina traži korekciju prema eksplicitnoj policy.asOfYear.                                                                                                                                |
| previousQualification  | Vrsta, oblast, ustanova ili null, zemlja prethodnog obrazovanja, completed/in_progress, godina ili null, credits ili null. Prethodno obrazovanje može biti van Srbije/EU; country je kandidatova tekstualna tvrdnja. |
| relevantSubjects       | Naziv + rezultat/credits ili null; bez preračunavanja ili priznavanja ekvivalencije.                                                                                                                                 |
| languageResults        | Jezik, test, broj/scale/datum/note ili null; rezultat nije dokaz zadovoljenog institucionalnog uslova.                                                                                                               |
| professionalExperience | Eksplicitna lista iskustava, moguća izričita prazna lista.                                                                                                                                                           |
| researchExperience     | Eksplicitna lista istraživačkih iskustava, moguća izričita prazna lista.                                                                                                                                             |
| orientation            | academic / practical / balanced / unsure.                                                                                                                                                                            |
| masterIntent           | specialisation / change_field / research_preparation / unsure.                                                                                                                                                       |
| phdTopic               | Tema ili istraživačko pitanje.                                                                                                                                                                                       |
| phdFunding             | fully_funded / partly_funded / self_funded / either.                                                                                                                                                                 |
| phdPositionType        | employed_position / scholarship_position / open_program / either.                                                                                                                                                    |
| phdFocus               | supervisor / project / institution / no_preference.                                                                                                                                                                  |
| researchProposal       | ready / draft / not_started / none.                                                                                                                                                                                  |
| hardConstraints        | Countries only_preferred/any_in_scope, languages only_listed/flexible, budget hard_maximum/target, dodatna lista uslova.                                                                                             |
| flexiblePreferences    | Zasebna lista fleksibilnih preferenci; ne predstavlja dozvolu za institucionalni waiver.                                                                                                                             |

Liste, tekst, brojevi, broj predloga i veličina lokalne istorije imaju eksplicitne granice u šemi. Destination kodovi ne tvrde da katalog pokriva sve EU zemlje. Slobodna `other` hard-constraint lista čuva tekst, ali ne sprovodi neimplementirana matching pravila. To mora rešiti Korak 7; `ready_limited` ne potvrđuje njihovo ispunjenje.

## Pet statusa i poreklo

| Status                | Značenje                                                 | Upotreba u profilu za buduću pretragu                                     |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- |
| user_stated           | Direktan eksplicitni typed korisnički odgovor.           | Može se koristiti kao kandidatov zahtev, bez nezavisne potvrde činjenice. |
| extracted_unconfirmed | Kandidat iz text/document/model ili context_review.      | Ne koristi se dok korisnik ne potvrdi ili sam ispravi.                    |
| confirmed             | Izričit korisnički confirm/resolve.                      | Može se koristiti kao kandidatov zahtev; nije potvrda ustanove.           |
| missing               | Vrednost null i nema skrivenog predloga.                 | Nepoznato, ne nula/prazna lista.                                          |
| conflicting           | Dve direktne tvrdnje, bez automatski izabrane vrednosti. | Sačuvani candidates; ne koristi se dok se ne razreši.                     |

Svako polje ima provenance (`origin`, `eventId`, `sourceRef`), sopstveni revision, pending proposals, candidates i reason. Predlog iz dokumenta ne menja confirmed/user_stated aktivnu vrednost: dodaje predlog, zadržava original i blokira upotrebu tog polja u `activeProfileProjection` do pregleda. `usableProfileProjection` je niži helper sa direktnim vrednostima; za buduću pretragu koristi active projection i obaveznu readiness proveru. Projection sam po sebi nije dozvola za matching, niti potvrda trenutne godine.

Preklop preferred/excluded, prazna allowed lista uz only_preferred i PhD self_funded + required scholarship su derived konflikti. `effectiveFieldStatus` prikazuje ih kao conflicting, uz očuvane originalne vrednosti; `assessProfile` dodatno proverava prošlu godinu. Konflikti/predlozi iz neaktivne MA/PhD grane ne pokreću nebitna pitanja; ponovo se pregledaju kada se ta grana aktivira.

## Događaji i izmene

Svaki ulaz ima ID i `baseRevision`, proverava se strict Zod-om i šemom ciljnog polja. Reducer pravi novi validirani objekat; odbijena tranzicija vraća nepromenjen original sa bezbednim kodom greške. Identičan već primenjen događaj je idempotentan; isti ID za različit payload, zastareli revision, pogrešan field/proposal ili nevalidna vrednost se odbija.

- `user_answer/assert` beleži neposredan odgovor. Različita druga tvrdnja formira konflikt; ne glumi correction.
- `user_answer/replace` je izričita korisnička korekcija. Nova vrednost i stara/nova field snapshots ostaju u history.
- `propose` dopušta samo text_extraction/document/model i izvor; nikada ne može sam potvrditi polje.
- `confirm` zahteva trenutni fieldRevision; kod predloga tačan proposalId. Blind confirmation nepotvrđenog dokumenta nije dopušten.
- `resolve` bira postojeći kandidat konflikta uz fieldRevision. Treća nova vrednost zahteva izričiti replace.
- `resolve_countries` potvrđuje obe liste atomski, samo bez preklopa. Semantic clarify koristi izričiti replace pojedinog polja; ne rešava se samo potvrdom nevalidne vrednosti.
- `reject_proposal` čuva prethodni direktni odgovor; ako prethodnog nema, polje ostaje missing kada nema predloga.
- `skip` odlaže polje i ne izmišlja odgovor; `resume` ponovo otvara njegov kontekst, ali ne resetuje ukupni plafon pitanja.

Promena nivoa traži novi pregled masterIntent, relevantSubjects i PhD kontekstnih polja; promena oblasti relevantSubjects, masterIntent i phdTopic. To važi i za razrešenje konflikta na novu vrednost. Ranije stvarne tvrdnje o obrazovanju/jezicima/iskustvu se čuvaju. Nema keširanih preporuka u ovom sloju; buduća UI/matching integracija mora poništiti rezultate posle promene profila.

History beleži before/after promenjenih polja i profile revision. Prikazivanje novih pitanja takođe povećava revision i beleži questions_presented. Najviše 256 lokalnih history stavki/primenjenih event IDs, tri pending predloga po polju. Ovo nije serverski audit, authentication, autorizacija ili zaštita od falsifikovanja browser stanja: budući endpoint mora da obezbedi korisničko poreklo, sesije i kontrolu troška. Ne postoji live endpoint ovog domena.

## Pitanja i spremnost

Minimalno potrebnih 13 polja: studyLevel, fieldOfStudy, studyGoal, preferredCountries, teachingLanguages, četiri budget komponente, scholarshipNeed, startYear, previousQualification i hardConstraints. Master dodaje masterIntent; change_field dodaje relevantSubjects. PhD dodaje topic/funding/position/researchExperience. Ovi pragovi su implementacioni izbor D-016 za ograničenu pretragu, ne nepromenljiva admissions pravila.

`advanceConversation` vraća 0–2 engleska pitanja. Konflikt ima prednost, zatim potvrda predloga pa required missing. Potvrđena aktivna vrednost se ne pita ponovo osim ako postoji novi predlog ili konkretan konflikt. Prvo se razjasne nivo/oblast. Budžet „10.000“ zahteva typed kandidat potvrdu; valuta, period i obuhvat ostaju zasebna pitanja bez defaults. Nema extractor-a slobodnog teksta.

Ponavljanje iste funkcije sa pending pitanjima vraća ista pitanja bez trošenja limita. Dva prikazivanja po nepromenjenom field revision/question context, najviše 24 ukupno; dalji unknown vodi u `paused_for_review` sa objašnjenjem, ne u lažnu dovršenost. Direktne korisničke dopune mogu popuniti profil i posle plafona ako ima mesta u istoriji. `skip` required polja ostavlja profil nedovoljnim. Opcioni nepotvrđeni podatak može se izričito odložiti, ostaje unknown i ne ulazi u projection.

`ready_limited` znači dovoljne kandidatove informacije bez aktivnog konflikta i bez required pending podatka. Ne traži se svaki opcioni podatak pre korisnog ograničenog rezultata; `unknownFields` jasno navodi preostala polja, `unknownDetails` dodatno navodi nepoznatu ustanovu/godinu/kredite ili delove predmeta i jezičkog rezultata, a English explanation razlikuje profil od kataloga/podobnosti. Nema izračunatih programa, rangiranja, verifikovane stipendije, rokova ili šanse prijema. Published katalog ostaje prazan. Izolacija sesija, kvote i prava obrada čekaju buduće korake.
