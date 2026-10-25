# Verifikacija Koraka 4

Istorijski dokaz tog koraka. Aktuelna integracija/sesije su u [Koraku 9](../integration/VERIFICATION.md); statički UI ostaje /preview, root / koristi lokalne rute.

Datum: 2026-10-05. Nalog: Prompt 4, plan (private development record). Lokalni Windows / Node 24.19 / npm 11.6.4 / instalirani Microsoft Edge. Rezultat: PASS statičkog sintetičkog UI-ja; nije product/pilot PASS iz [ACCEPTANCE](../PROTOTYPE_ACCEPTANCE.md).

## Stvarno izvršene provere

| Provera                                          | Rezultat i obuhvat                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`                           | PASS: završna provera formatiranja koda, README-a i novih UI/arhitekturnih dokumenata.                                                                       |
| `npm run typecheck`                              | PASS: Next typegen + strict TypeScript.                                                                                                                      |
| `npm run lint`                                   | PASS: nula upozorenja.                                                                                                                                       |
| `npm run test`                                   | PASS: 17 testova u 3 fajla; 10 prethodnih serverskih + 7 ključnih UI render provera.                                                                         |
| `npm run build`                                  | PASS: početni UI, /technical i postojeće health/mock rute. Bez API ključa ili stvarnog dobavljača.                                                           |
| `npm run test:boundary`                          | PASS u ovom koraku: zaseban negativni build odbio je server-only config u Client Component-u; kasnije UI dorade nisu menjale serverske module ili ovaj test. |
| `PLAYWRIGHT_CHANNEL=msedge` + `npm run test:e2e` | PASS: 10 testova, 7 obrazovnih + 3 postojeće tehničke provere. Test ima svoj production loopback server na 3100.                                             |
| Dokumentacija/izvori                             | Relativni linkovi, status Koraka 4/5–12, inventar i SHA-256 originalnog PDF-a provereni završnom lokalnom proverom.                                          |

Obrazovni browser walkthrough blokira svaki /api/ i svaki zahtev van lokalne aplikacije; postignuti tok od cilja do izvora i sledećeg koraka ima nula takvih zahteva i browser grešaka. Reload uklanja podatke. Test korekcije proverava grešku/fokus za negativan iznos, brisanje rezultata, povratak fokusa, očuvanje EUR 1,000 profila posle greške/retry-ja i zabranu zastarelih rezultata kroz AI fallback. Test dozvole proverava direktni Conditional izbor, No, Yes, revoke i ispravku profila. Galerija proverava svih 17 stanja, 0/1/2/3 kartice i odsustvo starih poruka/polja posle isteka. MA/PhD imaju različita pitanja i funding oznake.

Mobilni test prolazi ceo tok i svih 17 stanja na 390 i 320 px, bez horizontalnog overflow-a. Tastatura proverava prvi skip link, njegov vidljiv fokus, prelazak na main, sledeći Bachelor’s button i aktivaciju Enter-om. Contrast obračun stvarnih CSS parova i semantičke komponente opisani su u [DESIGN_SYSTEM](DESIGN_SYSTEM.md); ovo nije puni screen-reader/WCAG audit.

## Vizuelni pregled

Playwright čuva stvarne PNG snimke u `.cache/ui/` (razvojni dokazi, izuzeti iz formatter-a). Pregledani desktop welcome, tri preporuke, loading, otvoreni izvori/sledeći korak, odobrena alternativa, unverified, server error i empty catalog; mobilni welcome na 320 px, options, konflikt na 390 px, permission/expired na 320 px. Nema očiglednog preklapanja, isečenih kontrola ili horizontalnog skrola na pregledanim ekranima. Tekst se prelama u visinu.

Ključni lokalni snimci obuhvatili su desktop početak, izvore i sledeći korak, alternativu posle dozvole, mobilne opcije, 320 px permission i 320 px expiry. Ignorisani su iz Git-a; javni demo snimci su u [`docs/demo/assets`](../demo/assets/index.html). Full-page screenshot QA otkrio je da se offscreen skip link pojavljuje pri skrolu; skriven je opacity-jem dok nije fokusiran, uz browser provere oba stanja i ponovljene snimke.

## Ispravljeni problemi i obuhvat

Prvi lint je odbio native link za početnu Next stranicu; zamenjen je Next Link-om. Prvi browser prolaz imao je 7 PASS / 3 FAIL zbog exact-text locator-a nad `dd` koji sadrži i value i status; locatori su vezani za semantički definition, uz iste očekivane podatke/broj kartica. Naknadne provere su prošle. Doterani su konzistentna potvrda galerijskih profila, poruka posle Confirm, fokus Save/Cancel, očuvanje izmenjenog brief-a pri grešci i fallback koji ne vraća stare fiksne rezultate. Browser provere ponovljene posle poslednje UI izmene.

Kod/komponente/stil/fixture/testovi su lokalne promene. Nema novih npm zavisnosti, promene lockfile-a, Git/GitHub repozitorijuma, tajni, server kataloga, realnog AI-ja, baze, cloud naloga ili deploy-a. PDF ostaje SHA-256 `727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84`. Koraci 5–12 nisu započeti.

## Lokalni razvojni pregled i očuvanje izvora

Završno provereni / i njegov CSS na portu 3000: HTTP 200, English lang, study-workspace, Synthetic demo i pravila prikaza. Pre toga dugotrajni dev proces imao je HTTP 500 zbog keširanog unresolved study.css importa iz trenutka dodavanja novog fajla. Sam restart nije bio dovoljan; zaustavljen je sopstveni dev proces i uklonjen samo provereni generisani `.next/dev` cache, pa ponovo pokrenut dev. Kod i production build nisu menjani ovom popravkom. Loopback pregled je ostavljen na 3000.

Završni inventar: 55 baseline fajlova; 21 namerno promenjen i 34 nepromenjena, nula nestalih. Paket/lockfile, Next config, server/domain moduli, izvorni PDF, PRODUCT i PLANS nisu promenjeni. Posle dopune UX pitanja proverena su 22 Markdown dokumenta i 166 relativnih linkova, bez grešaka. Nema Git diff-a jer repozitorijum nije postojao; korišćeni sadržaj i kontrolne sume. Novi UI/test/plan dokumenti su odvojeni od ranijih izvora.

## Ograničenja

Fixed mock tekst nije NLP/AI. Izmenjeni profil ne dobija novi matching. Izvori/datumi nisu proverene činjenice, niti je prikazani program stvarna ustanova. Permission/expiry/error su namerne UI simulacije; ne dokazuju session isolation ili stvaran dobavljački timeout. Nema testa svih 12 produktnih fixture-a, intervjua ili pilot korisnosti. Edge provera ne dokazuje Chromium/Firefox/Safari ili sve asistivne tehnologije.

Poznata razvojna dependency/ESLint ograničenja iz [Koraka 3](../architecture/VERIFICATION.md) ostaju evidentirana; audit nije ponovo izvršen u ovom UI koraku i ne tvrdi se da je čist. Nove zavisnosti nisu dodate. Tehnička dijagnostika ima zasebne postojeće testove; tvrdnja „bez API-ja“ važi za obrazovni UI walkthrough.
