# Determinističko filtriranje i rangiranje — Korak 7

Verzija 1, 2026-10-06; Prompt 7, Master plan str. 17 i 39–41, D-017/D-018. Plan (private development record), [izvršeni primeri](SCENARIOS.md), [dokazi](VERIFICATION.md). Produktne poruke su English-only (D-002). Nema AI-ja/NLP-a, sesija ili povezivanja sa browser UI-jem; to ostaje kasniji integracioni korak.

## Ulaz i granice poverenja

[schema.ts](../../src/features/matching/schema.ts) validira profil, normalizovani katalog, datum i scoped consent, kao i strict public output. Profil mora da prođe Korak 6 readiness; koristi se active projection bez pending predloga. Sve originalne nepoznanice profila, uključujući nested qualification/test detalje, prenose se u gaps. Missing excludedCountries nije tvrdnja da nema isključenja: primenjuju se samo izričito navedena, a nedostajući podatak ostaje vidljiv. Potvrda korisnika nije nezavisno institucionalno priznanje diplome ili testa.

Normalized program ima program/intake ID, identitet/nivo/zemlju, editorial topics, jezike, explicit cost amount/currency/period/coverage, funding route, preference annotations, institutional rules i proof references. Proof čuva fact/source IDs, verification status, checkedOn, startYear i candidateScope all/unresolved. Unknown/reference konflikt, nepotvrđen izvor, nevažeći year/applicant scope i star/future check nisu pozitivna potvrda. General check je konzervativno najviše 30 dana, deadline 7 dana i 1 dan kada je blizu; compiler dodatno koristi strožu postojeću catalog freshness proveru. Datum je eksplicitan radi reprodukcije.

Ulazni katalog ima mode synthetic/published/staging_preview, koji izlaz obavezno čuva. Sintetički fixture nikada nije realni univerzitet/izvor. Staging ne daje opcije ni permission requests. Server [adapter](../../src/server/matching/catalog-adapter.ts) prolazi postojeću integrity/publication kapiju i nikad ne menja/promoviše originalni katalog. Produkcioni poziv mora čitati server-owned published katalog; korisnik ne sme sam birati proizvoljan katalog, rule ili consent objekt. Trenutno nema takvog endpoint-a ili sesijske autorizacije.

## Redosled

1. Readiness, then publication/coverage kapija. Nedovoljan profil → needs_profile; staging → catalog_unpublished; prazan published → catalog_empty, ne „nema podobnih ljudi“.
2. Nivo pa relevantna oblast. Known pogrešan nivo ili editorial subject mapping isključuju program pre institucionalnih/ranking provera. Editorial mapping nije zvaničan admissions uslov; interest reasons zato nemaju lažne source reference. Eksplicitne aliases su computer science/software engineering/informatics, business/business administration i machine learning/artificial intelligence; ostalo je exact trim/lowercase. Nema semantičkog modela ili fuzzy substring-a. Uska taksonomija može dati false negative i zahteva ručni pregled, ne globalnu tvrdnju da programa nema.
3. Primena izričitih hard ograničenja i detekcija preference deviations. Country, excluded_country, language i budget imaju zasebne structured deviation zapise. Soft country preference utiče na poredak, ali opcija van navedene preference i dalje prvo čeka dozvolu, prema Promptu 7.
4. Finansije i institucionalna matrica. Obavezni poznati not_met isključuje program; user consent to ne menja. Unknown/source_conflict se čuvaju kao takvi, sa source/fact ID-jevima i korakom provere.
5. Rank samo preživelih kandidata; known checked constraints pre unknown kandidata, zatim internal weighted ordering i stabilni program/intake ID tie-break. Granted alternative dolaze odvojeno posle normalnih opcija. Najviše tri prikazane opcije ukupno; nula/nepotpuna ponuda se ne dopunjuje fiktivnim ID-jevima.
6. Public rezultat: structured reasons/checks/warnings/deviations/nextStep, aggregate rejection counts bez skrivenih identiteta. Nema score, weights, fit percentage ili admission probability polja. Unknown uslov dobija needs_verification, ne confirmed eligibility. verified_constraints znači samo proverene navedene constraint checks, ne prijem.

## Finansije

Ista valuta, uporediv period i isti obuhvat potrebni su za pozitivan affordability check. Month/year se eksplicitno prevodi pomoću 12 meseci; semester billing ili whole-degree trajanje se ne nagađa. Currency mismatch i annual/total-degree mismatch ostaju unknown; nema spoljnog kursa, currency API-ja ili izmišljene konverzije.

Tuition-only ispod ukupnog budžeta ne potvrđuje affordability sa životnim troškovima. Tuition-only iznad ukupnog budžeta može dokazati excessive lower bound; i tada ostaju nepoznati dodatni troškovi. Total costs ne izoluju tuition-only. Izričita nula je broj, unknown nije nula. Scholarship/funding possible se nikad ne oduzima od troška. Required scholarship bez poznate funding route isključuje; moguće/nepoznato finansiranje čeka conditional permission i ostaje uslovno posle dozvole. Nema evidence o individualno odobrenoj stipendiji ili garantovanom zaposlenju.

## Institucionalni statusi

| Status          | Značenje                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| met             | Provereno konkretno pravilo, npr. verified deadline date koja je još u budućnosti. Closing time i dalje treba proveriti. |
| likely_met      | Kandidatovi self-reported podaci odgovaraju typed pravilu, uz obaveznu potvrdu ustanove.                                 |
| not_met         | Dostupni eksplicitni podaci ne ispunjavaju provereno obavezno pravilo; kandidat se isključuje.                           |
| unknown         | Nedostaje relevantan podatak/proof/scope ili nema bezbednog typed tumačenja.                                             |
| source_conflict | Konfliktan proof, bez biranja pogodnije tvrdnje ili automatskog poređenja.                                               |

Typed rules: accepted qualification kinds, credit minimum/same ECTS system, required subject list, language-test minimum/known maximum/same scale/date, deadline date i manual review. Nema zaključka o foreign degree equivalence ili priznatom sistemu „other“. Partial subject list ne dokazuje da predmet nije položen; izričito none može biti poznato neispunjenje. Pogrešna/missing skala i score izvan validnog maksimuma ostaju unknown. Deadline danas bez closing time nije sigurno met. Nepotpuna/empty rule inventory ne znači da ustanova nema uslove: `requirementsComplete: false` zadržava needs_verification čak i ako svi pojedinačni navedeni uslovi prolaze. Realni adapter trenutno uvek postavlja false; samo eksplicitno potpuna sintetička postavka koristi true. PhD topic/position/funding ostaju izričit pregled, bez mentora ili finansiranja izvedenih iz naziva.

## Rangiranje

[ranking.ts](../../src/features/matching/ranking.ts) koristi radne težine iz Prompta 7: interest 40, finance 20, location 15, language 15, other 10. Vrednosti komponente su interni 0–1, bez UI procenta. Subject match je osnovni filter; ako su interesovanja navedena, polovina interest komponente prati oblast, polovina fraction exact topic overlaps. Finance/language daju pozitivan doprinos samo uz uporediv verified check. Unknown relevantne kategorije dobijaju 0, ne nagradu ili automatsko uklanjanje njihove težine.

Nerelevantno ima null: country preference eksplicitno prazna, ili nema dodatnih potvrđenih preferenci. Tada weights normalizuju sumu preostalih na 1. Other doprinos koriste samo confirmed orientation/flexiblePreferences i evidence annotations; ne score-uju pretpostavljen internship/veličinu grada. Sve-null komponente daju zero bez NaN. **Ovo nije naučno validiran fit/admissions model**, verovatnoća prijema niti univerzalna procena kvaliteta. Numeric score je privatni ordering/debug podatak; strict public schema ga odbija.

## Alternative i saglasnost

Public permission request sadrži opaque request ID, profile revision, konkretna odstupanja i English pitanje; nema program/intake ID-ja, naziva, institucije ili izvora skrivene alternative. [engine.ts](../../src/features/matching/engine.ts) privatno čuva te evaluacije. Dozvola se može dati samo trenutno ponuđenom zahtevu. Grant veže tačan program/intake, profile revision/active values, datum, catalog version/channel i ceo normalized zapis/deviations. Promena relevantnog sadržaja, profila ili datuma traži novu dozvolu; request ID sam nije token autorizacije.

Granted opcija zadržava conditional_alternative, upozorenja i izvore; ne menja originalna hard ograničenja i ne waivuje institucionalne uslove. Revoked/No uklanja karticu i ne ponavlja isti permission request u istom kontekstu. Nijedan poznato failed mandatory institutional kandidat ne može dobiti grant. Consent objekti su **lokalni deterministički ugovor, ne bezbednosni token ili implementirana session zaštita**; budući endpoint mora da potvrdi korisničko poreklo i čuva grants na serveru, umesto prihvatanja browser claims.

## Stvarni katalog i ograničenja

Postojeći compiler normalizuje identitet i exact, unqualified language facts, a source freshness/reference/year/publication proverava validator Koraka 5. „Usually English“ nije automatski English hard-pass. CandidateCategory prose, maximal fees/ranges, scholarship tekst i institucionalni uslovi **ne postaju izvršivo applicant pravilo preko parser-a**. Dok nema pojedinačnog human-authored typed binding-a, cost je null/unresolved i requirement prose je manual/unknown. Published je trenutno prazan; staging osam programa ostaje review-only. To ne blokira proveru algoritma sintetičkim pravilima, ali ne dokazuje realnu matching pokrivenost ili human review.

Nepodržan additional textual hard constraint vodi needs_verification, nikada silently verified match. UI još nije povezan, nema pravog AI-ja, NLP-a, grant authentication-a, session isolation-a, cloud troška ili pilota. Novi server adapter nije javni endpoint. Originalni data/profile/UI/mocks se ne menjaju. Sledeći Korak 8 zahteva novi korisnikov prompt.
