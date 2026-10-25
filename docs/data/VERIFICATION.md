# Provere Koraka 5

2026-10-17, D-041: Viktorovo „odobravam sve kao što sam ti bio rekao“ potvrđuje predstavljeni BME 1.0.2 sadržaj i obe unknown za lokalnu objavu. Published 1.0.2 je validna unija neizmenjenog Psychology sadržaja i BME kandidata: 2 programa / 10 zvaničnih izvora / 40 činjenica / 40 evidence veza / 4 unknown / 2 human approvals, publication validator PASS. Kombinovani digest je `03981f3043869d37d4d0fe725ee07427c7d91261f790363edf697be9d29a53e3`. Ostalih šest staging programa ostaju pending; individualni fee/qualification/funding nisu automatski rešeni. [BME zapis i ciljane provere](TWENTE_BME_FINAL_REVIEW_2026-10-17.md).

2026-10-17, D-039: nakon stvarnog Viktorovog pregleda i izričitog odobrenja novog digest-a, [lokalno objavljeni Twente Psychology 1.0.1](TWENTE_PSYCHOLOGY_FINAL_REVIEW_2026-10-17.md) ima 1 program/5 izvora/18 činjenica, 16 verified i dve prihvaćene unknown. Publication validator PASS, nula issues; ostalih sedam staging programa nisu odobreni. Izvršni plan i regresije (private development record). Staging 8/28/142 i 37 warnings ostaje originalan. Raniji published=0/human PENDING rezultati ispod su istorijski. Precizne fee/qualification kategorije nisu automatsko individualno ispunjenje uslova; compiler čuva manual/unresolved.

2026-10-15, D-037: nova read-only provera staging 8/28/142, published 0, integrity PASS; 37 upozorenja (26 unknown + 11 effective stale). [Recheck izvora](SOURCE_RECHECK_2026-10-15.md) i [worksheet za Viktorov pregled](CATALOG_REVIEW_PACKET_2026-10-15.md) pripremljeni, coverage 142/142 facts i 28/28 sources. Originalni JSON/digest/dates očuvani; nema human approval-a ili objave. Viktor je izričito preuzeo pregled; no-tuition/general policy/closed 2026 rounds i unresolved applicant bindings ne postaju aktuelni eligible matching kroz API.

Datum: 2026-10-06. Status: **PASS — model i priprema lokalnog kontrolisanog kataloga**. Human review **PENDING**, published **0**, SQL execution **NOT RUN**. To nisu prećutne neuspele radnje: prompt traži relacioni model ili migracije i checklist; objava nije rezultat schema provere. Nema završene pilot/product kapije.

## Isporučeno

Strict Zod/TS ugovor; normalizovani institution/program/intake/source/fact/evidence/review; typed valute/periodi, kontekst kandidata, verifikacija/svežina; server-only integrity/publication validator, explicit reader i dva offline CLI alata. [PostgreSQL relacioni model](../../db/migrations/001_catalog.sql) ima release-aware FK/check/index, source scope spojnice i private default-deny RLS dizajn. Nije kreirana baza, importer ili public endpoint.

[Staging](../../data/catalog/staging/catalog.v1.json): **5 institucija, 8 programa, 8 intake/policy konteksta, 28 official izvora, 142 individualne assertions, 121 evidence veza**. Na dan pregleda 116 known assertions imaju scoped supports evidence, 26 unknown imaju null i razlog. Svi programi partial, reviews prazni. [Published](../../data/catalog/published/catalog.v1.json) prazan. Known assertion sa official izvorom nije ljudska potvrda ili individualna podobnost.

Četiri undergraduate, tri master, jedan PhD; Srbija/Nemačka/Holandija/Italija; computing, psychology, economics, biomedical engineering i management. [Svaka ključna tvrdnja i sva preostala nepoznata polja](INITIAL_CATALOG.md) mapirani su na URL/locator, authority, datum, status i kandidatski kontekst. Agent je pročitao relevantne zvanične program/admissions/finance stranice i PDF odeljke; nije proverio svaku moguću administrativnu regulativu niti ceo nacionalni registar.

## Izvršene softverske provere

| Provera                                | Rezultat i granica                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `catalog:check -- --as-of 2026-10-06`  | PASS oba kanala; staging 8 programa / 26 unknown upozorenja / 0 integrity grešaka; published 0 / 0. Read-only, bez fetch-a/promocije.                                                |
| `catalog:report -- --as-of 2026-10-06` | Izvedeni pregled osam programa, svih 142 fact IDs i svih 28 source URL-ova, sa content digest-om.                                                                                    |
| Vitest                                 | **36/36 PASS**, četiri fajla: prethodnih 17 i 19 novih katalog testova. Synthetic approval postoji samo u unit fixture-u; produkcioni reviews nisu popunjeni.                        |
| Strict typecheck                       | PASS posle konačnih validator/freshness izmena.                                                                                                                                      |
| ESLint                                 | PASS, bez warnings.                                                                                                                                                                  |
| Prettier                               | PASS za matched autorske fajlove; izvorni/raniji dokumenti po postojećem ignore ugovoru.                                                                                             |
| Next production build                  | PASS; postojeće rute `/`, `/technical`, `/api/health`, `/api/mock`. Nema nove katalog rute ili promene produktnog UI-ja.                                                             |
| Negativna server-only granica          | PASS: zaseban Next build odbio nedozvoljeni client import identične kopije server konfiguracije.                                                                                     |
| PostgreSQL izvršavanje                 | NOT RUN; `psql` nije dostupan, engine nije potvrđen. Model/FK/check pregledani kao dizajn; nije dokaz uspešne migracije ili cloud izolacije.                                         |
| Browser regresija / pilot              | NOT RUN u Koraku 5; UI/transport fajlovi identični baseline-u. Istorijskih 10 Edge provera iz Koraka 4 ostaje u [UI dokazima](../ui/VERIFICATION.md), nije nova provera ovog datuma. |
| Human approval / publikacija           | PENDING / nije izvršena. Pripremljena [checklist](CATALOG_REVIEW.md), bez poruke Tari ili izmišljenih rezultata pregleda.                                                            |

## Negativna ponašanja pokrivena testovima

Unsourced program ne može fully_verified; svaka obavezna grupa mora biti known/unknown. Missing deadline ostaje null; invalid valuta/nivo/date/URL se odbija. Stale status i istorijska vrednost ostaju vidljivi; evidence datum se proverava nezavisno. Bliski rok traži dnevnu proveru. Dve sourced suprotne assertions u istom kontekstu ostaju conflicting, dok različite fee kategorije nisu lažni konflikt. Unofficial evidence ne postaje institutional proof; spoof domen, pogrešan program/intake/source, duplicate ID i dangling published reference se odbijaju. Fee/living estimate ne može postati tuition. Schema PASS/agent approval/incomplete checklist ne objavljuje podatke. Human mora prihvatiti svaki unknown, pregledati tačan digest i pravilan datum; edit ili zastarelost poništavaju publication readiness.

## Doslednost i očuvanje

Baseline pre rada: 71 fajl, sačuvan lokalno. Namerno izmenjeni postojeći fajlovi: AGENTS, README, package scripts, tsconfig (explicit TS imports za Node 24 CLI), catalog type re-export, SCOPE, DECISIONS, OPEN_QUESTIONS i glavni izvršni plan. Package-lock, postojeći UI/transport/testovi, serverski mock i ostali nepovezani dokumenti imaju iste kontrolne sume. Nijedan postojeći fajl nije obrisan/pomeren. Originalni prompti u Downloads samo čitani.

Master PDF SHA-256 ostaje `727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84`. Pregledani samo relevantni delovi, posebno str. 40–43. Provereno 221 lokalnih relativnih linkova i kompletna report/JSON pokrivenost; 62 baseline fajla neizmenjena, devet namerno dopunjenih, nijedan nestao. Nema Git/remota; nema diff/push/CI tvrdnje.

## Preostalo i granice

26 unknown i program notes navode tačne praznine, posebno kandidatove troškove, future-year rokove/politike, stipendije i formalnu podobnost. Fee component nije total-degree affordability dokaz. Stariji zatvoreni konkursi ostaju istorijski; Twente 2027 podatak ne proširuje automatski dostupnost drugog programa. Digest proverava promenu sadržaja, ne ljudski identitet; trusted review/DB publication tok treba implementirati pre live pohrane.

Nema novih paketa, cloud troška/deploy-a, stvarnih korisnika, matching-a, AI-ja, sesija ili intervjua. Raniji razvojni audit/ESLint dug iz [Koraka 3](../architecture/VERIFICATION.md) nije rešavan niti novi audit proglašen čistim. Korak 6 nije započet i čeka zaseban prompt.
