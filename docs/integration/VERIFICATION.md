# Verifikacija Koraka 9

Datum 2026-10-08. Status: **PASS — lokalni integrisani mock tok**. [Ugovor](CONTRACT.md), plan (private development record).

## Implementirano

Integrisani engleski root UI, šest lokalnih HTTP ruta, serverski profil/pitanja/confirmation/conflicts, matching/ranking, strict mock AI objašnjenje, visible-only sources, scoped grants/revoke, session feedback/brisanje. Stari UI je na `/preview`, stare provere menjaju samo putanju. Published prazan, staging i originalni izvori ne menjaju se.

## Izvršeno do sada

263 unit/integration testa u 11 fajlova PASS (236 ranijih + 27 novih). Tri nivoa, empty published/no-match, unsafe/out-of-scope, budget conflict, grant/revoke/edit, fake timeout/refusal/invalid/rate/budget/unavailable, strict input/stale revisions, isolation/expiry/delete/late completion, streaming body, explicit EUR/USD konflikt, bounded history/action cap, odbijanje alternative, malicious selection i svih šest HTTP ugovora. Strict typecheck i production build PASS.

Prvi lint našao native root link/apostrophe: ispravljeni Next Link/entity; poslednji build PASS. Prvi PhD test očekivao običnu opciju i FAIL: required-funding politika traži permission za conditional alternative. Test/tok usklađeni s postojećom politikom, bez ublažavanja matching pravila. Ponovljeni svi lokalni testovi PASS.

## Browser i vizuelni dokaz

Završni Edge run: **19/19 PASS, exit 0**, devet novih integrisanih i deset prethodnih provera. Tri nivoa, sources/next step, reload/feedback/delete, no-match/empty published, out-of-scope, budget conflict, alternative grant/revoke/hidden GET, provider unavailable sa eksplicitnim browse-om; 320/390px bez horizontalnog overflow-a i tastatura/skip link. Nema manual data repair-a. Provereni desktop bachelor, PhD sa otvorenim unknown izvorima, alternative pre dozvole i mobile 320 screenshot; nema vidljivog preklapanja/isečenih kontrola. Dugačak profil se skroluje; ovo nije optimizacija svakog ekrana ili puni WCAG audit.

Lokalni dokazi u ignorisanoj `.cache/integration/` obuhvatili su bachelor desktop, PhD unknown i izvore, dozvolu pre identiteta, 320px i 390px prikaze. Javni demo snimci su u [`docs/demo/assets`](../demo/assets/index.html).

Prvi browser prolaz je otkrio stvarni 403: Next je rekonstruisao interni port različit od browser Origin-a. Guard sada zasebno validira lokalni Host i poredi njegov public origin; dodata pozitivna/negativna regresiona provera. Select locator koristi accessible combobox role. Stari mobile gallery test imao timeout pri 33.8s, pa njegov rok sada 60s uz iste kriterijume; završni run 17.6s.

Preset sa sopstvenim webServer-om je prikazao svih 19 PASS ali zatvaranje podprocesa zastalo je u Windows sandbox-u, pa je zaustavljen sopstveni runner. Kontrolisani server na 3200 zatim dao 17 PASS/2 FAIL jer dve stare mrežne zabrane namerno dopuštaju samo 3100. Nisu menjani ti kriterijumi: ponovljen **identičan ceo skup na 3100**, s odvojeno pokrenutim sopstvenim serverom i privremenim `.cache/playwright-prompt9.config.ts` koji isključuje samo automatsko upravljanje serverom. Komanda `PLAYWRIGHT_CHANNEL=msedge; node node_modules/@playwright/test/cli.js test --config .cache/playwright-prompt9.config.ts` završila se exit 0. Test server se zatvara odvojeno kao sopstveni provereni listener; nema prekidanja tuđih procesa ili potrebe za eskalacijom.

## Ostale provere i očuvanje

Završni lint/strict typecheck/build PASS. Format prvo upozorio na tek dopunjen verification dokument; dokument formatiran i završni format proverava konačni sadržaj. Katalog validator 2026-10-08: staging 8 programa/28 izvora/142 facts, 27 warnings/0 issues; published 0 programa/0 issues. To nije human review ili publication.

Baseline 131 autorski fajl: 13 namernih dopuna, 118 nepromenjenih, 19 novih; nula nestalih ili neočekivanih izmena. Ukupno 150 autorskih fajlova. Paket/lockfile, domain/profile/matching/AI/katalog/stari UI/dijagnostika, PRODUCT/PLANS i originalni PDF očuvani. Nema Git diff-a; pregledan novi sadržaj i korišćene SHA-256 kontrolne sume. PDF `727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84`. Prompt u Downloads samo pročitan.

Dokumentacioni pregled doslednosti D-002 i granica 9/10, 46 Markdown dokumenata/405 relativnih linkova bez grešaka u završnom pregledu. Izveštaj `.cache/prompt9-preservation-links.json`. Oba negativna Next build-a PASS/exit 0: Client Component import stvarne source kopije server konfiguracije i OpenAI provider-a je odbijen. Dodatni pregled client chunk-ova nije našao session-cookie naziv, ConversationService ili skriveni synthetic-over-budget ID. Završni format/link run PASS/exit 0 posle evidencije rezultata.

## Ograničenja

Nula live AI poziva/trošak USD 0. Nema NLP/provider quality/account access evaluacije. Fiktivni izvori/programi označeni; realni published nula/human review PENDING. Single-process ephemeral lokalna sesija nije pilot auth/distributed quota. Puni accessibility/cross-browser/security/pilot testovi nisu sprovedeni. Pravi dokumenti/lični podaci/cloud/publication nisu omogućeni. Bez novih paketa/lock izmene ili Git-a.

## Završni rezultat

Korak 9 je završen za odobreni lokalni sintetički obim. [Pregled aplikacije](http://127.0.0.1:3200/) ima HTTP 200; sopstveni production loopback proces je ostavljen radi pregleda. Stari dev port 3000 nije preuzet ili gašen. Test server 3100 ugašen je posle provera: Ctrl+C u Windows PTY-ju nije zaustavio Node, pa je lokalnim netstat/Process pregledom utvrđen samo sopstveni listener PID 5300, potvrđen executable i vreme pokretanja, i zatvoren taj proces. Listener zatim nije prisutan. Pregledni server 3200 ostaje dostupan. Faza 1/pilot nisu završeni; Korak 10 čeka sledeći zaseban korisnikov prompt.
