# QA izveštaj — Korak 11

Post-closeout napomena 2026-10-17, D-043/D-044: ovaj izveštaj zadržava izvršene QA rezultate od 11. oktobra. Naknadno je published katalog 1.0.3 ljudski odobren i validiran sa osam programa/31 izvorom/145 činjenica/26 visible unknown; [aktuelni završni status](../PHASE_1_CLOSEOUT.md). To ne pretvara raniji mock QA u live/pilot/cloud dokaz.

Datum: **2026-10-11**. Kandidat: lokalni English-only mock prototip nakon Koraka 10. D-025/D-026. Novi produktni razvoj zamrznut; promenjeni su evaluacioni/test alati i dokumentacija, bez novih funkcija ili paketa.

**Lokalna mock kapija: PASS** za izvršeni skup. Nema poznatog otvorenog release blocker-a u omogućenom lokalnom toku; live/PDF/public pilot funkcije ostaju isključene. Ovo nije potvrda produkcione bezbednosti, kvaliteta pravog modela, tačnosti staging kataloga ili upotrebljivosti kod studenata. [Golden set](GOLDEN_SET.md), [security](SECURITY_REVIEW.md), [accessibility](ACCESSIBILITY_REVIEW.md), [known issues](KNOWN_ISSUES.md).

## Statusi

PASS = izvršeno i ostvaruje navedeni uslov; FAIL = izvršeno i ne ostvaruje; NOT RUN = nije izvršeno; BLOCKED = poznata kapija sprečava izvršenje; PRIHVAĆENO OGRANIČENJE = tehnička procena za uski lokalni mock obim, ne korisnikovo odobrenje pilota ili prećutno rešena greška.

## Rezultati i dokazi

| Provera / ulaz                                | Očekivano                                                 | Rezultat / ograničenje                                                                                                                    |
| --------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 50 golden scenarija                           | Tačan ishod/invariants/izvori; kritični AI x3             | PASS 50/50, 78/78; fake/mock, bez model-quality tvrdnje                                                                                   |
| Ceo Vitest                                    | Nema regresije                                            | PASS 357 testova / 13 fajlova: 278 baseline + 78 golden + 1 missing-Origin regresija                                                      |
| ESLint / strict TS + Next typegen             | Bez grešaka/upozorenja                                    | PASS; postojeći runtime, bez novih dependencies                                                                                           |
| Prettier                                      | Dosledan format                                           | PASS final format check nakon ciljane README/new-file format ispravke                                                                     |
| Production Next build                         | Exit 0                                                    | PASS Next 16.3.8; build sa isključivo fiktivnim server-key sentinel-om                                                                    |
| Edge Playwright / produkcioni server          | Glavni i negativni tok ponovljivi                         | PASS 27/27, završni runner exit 0; 23 baseline + 4 QA                                                                                     |
| Mobile / keyboard / basic a11y                | Bez overflow-a, dostupni controls/focus                   | PASS 320/390/1280; devet audit stanja i kompletan keyboard tok                                                                            |
| Dve sesije / forged/expired/revoked/deleted   | Bez tuđeg profila/izvora                                  | PASS golden, integration i independent browser contexts                                                                                   |
| Malicious/strict input/output                 | Nema dodatnih IDs/profil mutacije/fabrication             | PASS: invalid inputs, injection, invented source/program/intake/deadline, JSON/refusal/incomplete                                         |
| Provider timeout/rate/budget                  | Bounded pokušaj, bez lažnog uspeha                        | PASS fake provider, svaki critical AI slučaj x3; failure recovery u browser-u                                                             |
| Message/token/cost/concurrency                | Stop pre prekoračenja, deletion ne resetuje budžet        | PASS lokalne ledger/SpendGuard simulacije; pravi trošak USD 0                                                                             |
| Negativni client import build-ovi             | Server config i Responses ostaju server-only              | PASS obe očekivane build rejection provere                                                                                                |
| Client/trace scan                             | Nema server-key sentinel-a, key shape ili runtime storage | PASS 16 static fajlova, 17 nft inventara; 0 hits/unsafe trace                                                                             |
| Source ID/catalog validator                   | Bez orphan/invalid bindings ili published fallback-a      | PASS 8 staging / 28 izvora / 142 facts, 26 upozorenja; published 0; nije human fact review                                                |
| Dependency audit svih paketa                  | Nema poznatih advisories                                  | FAIL: 5 high u dev ESLint/fast-glob/micromatch/braces lancu; bez patcheve verzije braces u proveri                                        |
| Dependency audit omit=dev                     | Nema produkcionih advisories                              | PASS 0 prijavljenih; ne dokazuje sve moguće ranjivosti                                                                                    |
| Preservation / doc links                      | Samo ciljane promene, read-only izvori netaknuti          | PASS 177 fajlova: 12 novih, 9 ciljanih dopuna, 156 baseline sačuvano; 0 missing/unexpected; 58 Markdown / 497 lokalnih linkova bez broken |
| Live model / real PDF / cloud TLS / pilot     | Odobren i pregledan odgovarajući tok                      | BLOCKED, nije izvršeno; funkcije nisu omogućene                                                                                           |
| Screen reader / puna WCAG / nezavisni pentest | Poseban review                                            | NOT RUN; basic browser audit nije sertifikacija                                                                                           |
| Ljudski katalog i 5 UG+5 MA+2 PhD             | Pregled realnih facts/razumevanja                         | BLOCKED odgovarajućim publication/privacy/pilot kapijama, 0 učesnika                                                                      |

## Početni neuspesi i ispravke

Prvi golden prolaz bio je 70/78. Pregled ugovora utvrdio je greške oracle/fixture-a, ne opravdanje promene proizvoda: flow razlikuje matching status od visible issue; master sa self-report kvalifikacijom je needs_verification; source konflikt ima eksplicitni source_conflict status; excluded fixture je slučajno i preferirao istu zemlju, pa je profil pravilno tražio razjašnjenje. Fixture sada isključuje IT uz DE/NL preferenciju. Conditional deviations su upozorenje u zasebnoj strukturi. Popravke zadržavaju tačan očekivan ishod i source set.

Prva puna regresija: 7 FAIL u nasleđenom mock-route testu, koji nije slao Origin uveden Korakom 10. Testovi sada šalju lokalni Origin; invalid APP_MODE očekuje raniji guard 403, health i dalje 503. Dodata missing-Origin 403 regresija; guard nije oslabljen.

Prvi browser prolaz: 24 PASS / 3 FAIL zbog pogrešnog minimuma audit uzorka (>8); mobilni gate ima tačno 7 eligible opaque text elemenata, desktop 8. Minimum ispravljen na 7, contrast thresholds 4.5/3 i no-overflow/labels ostaju isti. Konačni pun prolaz 27/27. Prvi sandbox runner je zastao pri cleanup-u; identifikovan i zaustavljen samo njegov Next server 3100. Ponovljeni odobreni lokalni runner završio exit 0. Prvi network audit bio je blokiran sandbox-om; ponovljen read-only audit je dao aktuelni gore navedeni nalaz.

## Reprodukcija i release odluka

Node 24.x/npm 11.x iz postojećeg runtime-a. `npm run eval:golden`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, `npm run test:boundary`, `npm run test:ai-boundary`, `npm run catalog:check`, `node scripts/check-client-bundle.mjs`; Windows Edge: `PLAYWRIGHT_CHANNEL=msedge`, `npm run test:e2e`. Za sentinel dokaz pokrenuti mock build sa izmišljenom `OPENAI_API_KEY=FAKE_QA_SERVER_KEY_20261011`; pravi ključ se ne koristi. `npm audit --json` / `npm audit --omit=dev --json` ne instaliraju ništa. Lokalni ekvivalentni Node CLI pozivi stvarno izvršeni; npm pipe shell exit nije korišćen kao kriterijum audit prolaza, već JSON nalaz.

Sirovi lokalni rezultati su u ignorisanom `.cache/testing` (golden rezultat/manifest, dev/prod audit JSON, client scan, a11y JSON i devet screenshot-a). Dokumenti čuvaju zaključke i tačne brojeve i kada cache nije prenet. Nema Git diff-a; baseline hash pregled i sadržaj novih fajlova su pregledani.

Nula kritičnih povreda u definisanom skupu i isključene rizične funkcije dozvoljavaju samo ponovljiv **lokalni sintetički** demo. Razvojni dependency FAIL ostaje otvoren uz ograničen trusted-local tooling; ne izdaje se bezuslovni security PASS. O-004/O-005/O-006/O-007/Q-D03 ostaju otvoreni. Korak 12 nije započet ili odobren ovim izveštajem.

## Očuvanje i završni pregled

Baseline 165 → 177 autorskih fajlova; pregledan ceo novi evaluacioni kod i dokumentacija, 9 promena u dozvoljenoj listi. Nema Git-a; hash inventar potvrđuje 156 neizmenjenih, 12 novih i 0 nestalih/nepovezanih promena. Produktni server/domain/UI, staging/published, originalni prompt/PDF i package-lock nisu menjani u Koraku 11. PDF SHA-256 `727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84`. Relativni linkovi uključuju code/test/plan references i imaju 0 broken. Evidence inventar `.cache/prompt11-preservation-links.json`.
