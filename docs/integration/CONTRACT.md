# Vertikalni tok Koraka 9

Datum 2026-10-08; D-021/D-022. Plan (private development record), [dokazi](VERIFICATION.md), [AI ugovor](../ai/AI_CONTRACT.md), [matching](../matching/ALGORITHM.md). Master plan str. 37–39, 44, 47. Jedna Next.js aplikacija bez novih paketa; English-only.

## Korisnički tok i katalog

Root `/` sada koristi prave lokalne rute: prazan profil/pitanja → predložene fiktivne vrednosti ili korisnički strukturisani odgovori → pregled/izričita potvrda → matching/ranking → strict mock AI objašnjenje → izvori/unknown/sledeći korak. Profil/pitanja su Korak 6, matching/consent Korak 7, AI adapter Korak 8. Nije više samo statička promena scene. Stari walkthrough ostaje `/preview`; dijagnostika `/technical`.

Sedam serverski kontrolisanih scenarija: bachelor, master, phd, alternative, no_match, provider_unavailable, published. Bachelor ima dve fiktivne opcije. Master namerno nema prethodnu diplomu; obrazac i potvrda su obavezni, a ECTS/qualification ostaju self-reported. PhD sa required funding prvo traži dozvolu za nepotvrđeno finansiranje, zatim prikazuje conditional alternative i unknown research/employment uslove. Above-budget identitet/izvori skriveni su pre dozvole. Known mandatory institutional failure nema waiver; dozvola ne znači podobnost/prijem/finansiranje/vizu.

Published režim čita samo validirani postojeći published fajl: trenutno nula programa. Nema staging/synthetic fallback-a. Source detalji u ovom koraku podržavaju samo trenutno vidljive sintetičke rezultate, sa fiktivnim source/fact IDs/datumu/unknown/next step i bez izmišljene realne URL veze. Stvarni izvori/prijava zahtevaju human publication i pregled typed bindings. Originalni katalog/PDF ne menjaju se.

## Šest HTTP ruta i adaptacije

Sve rute su Node runtime, loopback-only (`localhost`, `127.0.0.1`, `[::1]`) i mock-only. Zadati APP_MODE mora biti mock; postojeći Origin mora odgovarati request origin-u i cross-site se odbija. To nisu pilot autentifikacija, DNS-rebinding zaštita ili odobren javni hosting. Odgovori imaju no-store/nosniff.

| Metod/ruta                  | Strict ulaz                                                                                 | Izlaz/ponašanje                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| POST `/api/chat`            | `{action:"start", scenario}`                                                                | Pravi prazan serverski profil/dva pitanja, cookie; zamenjuje prethodnu lokalnu sesiju.                                         |
| POST `/api/chat`            | `{action:"resume"}`                                                                         | Trenutni view; cookie ID ne dolazi kroz body/URL.                                                                              |
| POST `/api/chat`            | `{action:"message", revision, message}`                                                     | Najviše 8.000 znakova; scope/AI ili deterministička interpretacija, proposals/konflikt/pitanja.                                |
| PATCH `/api/profile`        | action prepare_example/confirm + revision; answer + field/value/mode; resolve + field/value | Postojeći reducer validira sve događaje, atomic batch; nevalidna promena ne commit-uje deo profila.                            |
| POST `/api/recommendations` | action search + revision/explain boolean; consent + revision/requestId/decision             | Confirmation/readiness gate, do tri determinističke opcije, objašnjenje ili eksplicitni browse; consent isključivo na serveru. |
| GET `/api/programs/:id`     | Path ID + cookie                                                                            | Samo ID u trenutnom rezultatu; ponovni matching/consent/time check; ostalo 404.                                                |
| POST `/api/feedback`        | revision/kind/message/programId                                                             | helpful/incorrect_source/other; 500 znakova, null ili visible programme ID; deset ephemeral stavki, bez slanja drugima.        |
| DELETE `/api/session`       | Cookie, bez body-ja                                                                         | Idempotentno brisanje store-a i cookie Max-Age=0; late completion ne vraća obrisanu sesiju.                                    |

Session revision je odvojena od profileRevision. Strict objekti odbijaju dodatne profile/catalog/model/consent parametre. Streaming body limit 40.000 bajtova radi i bez Content-Length-a; content-type/JSON/field schemas validiraju se. Uspeh `{session:SessionView}`, `{program:ProgramDetails}` ili `{deleted:true}`. HTTP greška `{error:{code,message}}`; workflow issue istog oblika u view-u. Nema raw trace/key/provider IDs, scopeKey, history/seenEvents/provenance ili modelskog konteksta. Client validira view/details i renderuje običan React tekst.

## Redosled i autoritet

1. Local/session/TTL → strict body/revision → per-session lock i kopija stanja za atomic commit.
2. Serverski adapter proverava scope pre interpretacije. Unsafe/unrelated poruka nema profile događaj i ne ostaje raw u istoriji.
3. Obrazac ide kroz reducer. Jedina dodatna deterministička poruka je `My budget is 7000 EUR`: beleži izričito navedene budgetAmount i EUR budgetCurrency, ne pretpostavlja period/living costs. Različit raniji iznos ili valuta stvara zaseban konflikt. Za ostale izmene koristi se obrazac; mock selector nije NLP extractor.
4. Model proposals koriste postojeći staging helper i ostaju nepotvrđeni; failure nema parcijalni overwrite. Samo korisnički događaji potvrđuju/ispravljaju/razrešavaju.
5. Persistirati profile pitanja/readiness, najviše dva. Required missing/conflicts/pending confirmation blokiraju matching.
6. Matching koristi serverski profil/katalog/datum/grants. Svaka profile promena odmah uklanja stare rezultate i sve alternative grants.
7. AI dobija samo strukturisanu projekciju i vidljivi rezultat, bez punog kataloga/istorije/institucije kandidata. Postojeća semantic/strict validacija proverava IDs/razloge/izvore/redosled; server hidrira sve warnings.
8. Failure objašnjenja ne vraća prikriveni fallback. Korisnik izričito bira “Browse without explanation”; potvrđeni profil ostaje.
9. Validirati public view; commit samo ako sesija i dalje postoji/nije istekla. UI loading i serverski lock sprečavaju paralelne promene. Invalid/throw ne commit-uje profil/consent.

## Lokalni session port i granice

Random 32-byte opaque cookie, HttpOnly/SameSite Strict/path `/`, Secure na HTTPS-u. Apsolutni TTL 30 minuta. Single-process memory store globalThis: najviše 50 sesija, 30 prihvaćenih radnji/minut/sesija, jedan aktivan zahtev, 20 poruka i deset feedback stavki. Reducer ima svoje bounded history/event/question limite. Lazy cleanup pri create/access; restart gubi sve. Izolacija različitih tokena, expiry/deletion i late completion proveravaju se. Nema persistence-a, pozivnica, distributed/global financial quota zaštite. Ovo je izričito dopuštena lokalna mock adaptacija Prompta 9, ne zamena za Korak 10.

Kodovi: INVALID_REQUEST, OUT_OF_SCOPE, NEEDS_INFORMATION, NO_CATALOG_MATCH, SOURCE_UNVERIFIED, PROFILE_CONFLICT, MODEL_REFUSAL, MODEL_INVALID_OUTPUT, PROVIDER_TIMEOUT, PROVIDER_UNAVAILABLE, RATE_LIMITED, BUDGET_EXCEEDED, SESSION_EXPIRED, INTERNAL_ERROR. Provider mape imaju fake-provider testove. Transport koristi 400/401/403/409/413/415/429; unknown/no-match/clarification vraćaju view bez izmišljene opcije.

Orchestrator direktno pravi mock provider; ne koristi env-switch live factory. Ni postojanje API ključa ne otvara plaćeni poziv. provider_unavailable je fault double. Live Responses/spend guard ostaje zasebna zatvorena kapija Koraka 8. Nula stvarnih AI poziva/trošak USD 0. Pravi dokumenti/lični podaci/pilot/cloud nisu omogućeni. Regex/local checks nisu kompletna semantic/security/NLP verifikacija; Koraci 10–12 ostaju zasebni.
