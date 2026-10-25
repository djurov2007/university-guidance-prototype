# Ljudski pregled kataloga

Aktuelno 2026-10-17, D-043/D-044: Viktor je odobrio tačan kombinovani 1.0.3 digest i svih 26 visible unknown. Published sada ima svih osam programa, 31 official izvor, 145 činjenica, 128 evidence veza i osam human approval zapisa. [Završni pregled](ALL_PROGRAMS_FINAL_REVIEW_2026-10-17.md). Donji D-041/D-039/pending odeljci ostaju istorija pripreme.

Aktuelno 2026-10-17, D-041: Viktor je izričito odobrio sve predstavljene BME 1.0.2 podatke i obe unknown. [Završni BME zapis](TWENTE_BME_FINAL_REVIEW_2026-10-17.md). Published 1.0.2 sada kombinuje neizmenjeni ranije odobreni Psychology sadržaj i BME sadržaj: dva programa, četiri prihvaćene unknown i po jedan human review za svaki program, vezani za tačan kombinovani digest. Preostalih šest staging programa nisu odobreni.

Aktuelno 2026-10-17, D-039: Viktor je završio pregled 18 Twente Psychology tvrdnji i odobrio konkretan novi digest/verziju 1.0.1, sa dve prihvaćene unknown i manual granicama. [Završni zapis i objavljeni snapshot](TWENTE_PSYCHOLOGY_FINAL_REVIEW_2026-10-17.md). Odobrenje je vezano za zaseban single-programme sadržaj; ne odobrava originalni kompletan osam-programski digest ili ostalih sedam programa. Prvobitni worksheet/candidate pending status ostaju kao istorija, published review sadrži novu izričitu odluku. Naredni odeljci opisuju prethodno stanje i opštu proceduru.

Aktuelno 2026-10-15, D-037: Viktor odgovara „Ja ću pregledati“ i preuzima human review. [Pripremljen paket sa svih 142 tvrdnje, osam obrazaca i digest-om](CATALOG_REVIEW_PACKET_2026-10-15.md), [agent recheck 28 izvora](SOURCE_RECHECK_2026-10-15.md). Pregled i dalje PENDING; 26 unknown i 11 efektivno stale na današnji datum. Prvo pregledati Twente 2027 zapise; stare zatvorene runde nisu aktuelne prijave. Ne potpisivati stari digest posle izmene podataka/datuma; regenerisati verziju/dokaz. Stariji paket ispod je istorijska osnova.

2026-10-06. Paket za Taru ili drugog **naknadno određenog** pregledavača. Niko nije označen kao da je već odobrio podatke. Trenutno: osam partial programa u staging-u, reviews prazni, published prazan. Završetak pripreme Koraka 5 ne zahteva izmišljanje human approval-a.

Predmet: [osam programa, svaka ključna tvrdnja i sva unknown](INITIAL_CATALOG.md), [JSON](../../data/catalog/staging/catalog.v1.json), [authority](SOURCE_AUTHORITY.md), [freshness](FRESHNESS_POLICY.md). Kontrola uvek na celoj konkretnoj verziji/digest-u; validan JSON nije dokaz tačnosti.

## Checklist za svaki program

- [ ] Potvrditi instituciju, originalni/normalizovani naziv, degree type, campus i stable program ID; posebno track i profesionalni naspram akademskog master-a.
- [ ] Otvoriti svaki ključni izvor, potvrditi zvaničnog publisher-a, datum i pravni prioritet originala/prevoda.
- [ ] Proveriti da evidence locator/parafraza stvarno podržava baš tu tvrdnju; general URL ne potvrđuje sva polja.
- [ ] Potvrditi jezik nastave, kvalifikatore i trajanje; UI jezik proverava se zasebno.
- [ ] Potvrditi godinu, intake/rundu, akademsku i kandidatsku kategoriju. Stari rok je closed; novi datum se ne izvodi promenom godine.
- [ ] Proveriti sve qualification/subject/language uslove; označiti šta zahteva individualnu institucionalnu procenu. Ne obećavati prijem.
- [ ] Potvrditi trošak, valutu, period, tuition/fee, maksimalni doprinos naspram stvarnog računa, exempt categories. Living estimate nije univerzalni ni kompletni total.
- [ ] Proveriti stipendiju/poziciju, konkurentnost, gross/net, eligibility, restricted research topic i stvarni award. Program nije automatska finansirana pozicija.
- [ ] Ponovo otvoriti kritične deadline/funding/fee izvore u granicama freshness politike. Konflikt/unverified/stale blokira objavu.
- [ ] Pročitati **svaki unknown ID**, potvrditi razlog i odlučiti da li je prihvatljiv za objavu kao vidljiva praznina. Ne popunjavati nagađanjem.
- [ ] Pokrenuti validator i uporediti trenutni content digest. Zabeležiti ime/identitet stvarnog pregledavača, datum, odluku i kompletne unknown acceptance IDs.
- [ ] Potvrditi da publikacija i eventualna upotreba imaju odobren tok. Nijedna odluka iz ovog praznog obrasca nije izvršena.

## Obrazac koji popunjava čovek

| Polje                                 | Za unos pri stvarnom pregledu |
| ------------------------------------- | ----------------------------- |
| Program ID i intake                   | —                             |
| Reviewer / uloga                      | —                             |
| Datum pregleda                        | —                             |
| Version / content digest              | —                             |
| Odluka approved/rejected/pending      | —                             |
| Checklist complete                    | —                             |
| Prihvaćeni unknown Fact IDs i razlozi | —                             |
| Konflikti / ispravke / izvor potvrde  | —                             |
| Datum naredne provere                 | —                             |

Review zapisi imaju typed strukturu u [šemi](../../src/features/catalog/schema.ts); testni primer odobrenja je samo sintetički unit fixture i ne upisuje se u katalog. Digest je kontrolna suma, ne dokaz identiteta čoveka. Ne postoji admin/review UI niti importer u bazu.

## Lokalna provera i regenerisanje pregleda

```powershell
npm run catalog:check -- --as-of 2026-10-06
npm run catalog:report -- --as-of 2026-10-06
```

Prva komanda read-only proverava oba kanala, izlazi neuspešno na integrity/published problemu; unknown u staging-u je upozorenje, ne propust validatora. Za jedan fajl: `--file data/catalog/staging/catalog.v1.json`. Druga ispisuje izvedeni Markdown sa source mapom i unknown; ne menja podatke i ne objavljuje ništa. Sačuvani izveštaj mora odgovarati proveravanom JSON-u/digest-u. [Stvarne provere](VERIFICATION.md) odvajaju softverski PASS, SQL NOT RUN i human review PENDING.
