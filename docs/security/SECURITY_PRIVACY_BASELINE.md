# Početna bezbednosna i privacy osnova

Datum: 2026-10-11. Korak 10, D-023/D-024. Lokalni prototip za pozvane punoletne testere sa fiktivnim podacima. **Nije potvrda produkcione bezbednosti niti odobrenje pravog pilota.** [Pretnje](THREAT_MODEL.md), [čuvanje](LOGGING_RETENTION.md), [dokazi](VERIFICATION.md).

## Pristup i sesije

Operator na lokalnom računaru izvršava `npm run invitation:create -- 1` (do 100 kontrolisanih upotreba) ili `npm run invitation:revoke -- <UUID>`. Komanda create čuva kod u ignorisanom `.local/security/local-review-invitation.txt`, ne ispisuje ga u operativni log. To je poverljivi operator fajl, nije javni artefakt; obrisati ga kada više nije potreban. Svaka nova create komanda prepisuje ovaj fajl, a prethodna pozivnica ostaje važeća do opoziva/isteka. Opoziv traži njen ID. Default rok pozivnice 24h, serverski maksimum sedam dana. Kod ima 256 slučajnih bitova, SQLite čuva samo SHA-256. Nema javne registracije, lozinki ili admin HTTP rute.

`POST /api/session/redeem` prima strict JSON: code, adult=true, privacyNoticeAccepted=true, noticeVersion=synthetic-privacy-1, scenario. Kod ne ide kroz URL. Transakcija atomskim upisom ograničava broj upotreba i daje nov nepredvidiv 256-bitni session token; baza čuva njegov hash. Profil/sadržaj nisu u registru. 18+ je lična deklaracija, nije potvrda identiteta. Pri grešci stvaranja profila transakcija ne troši pozivnicu.

Cookie study_demo_session je HttpOnly, SameSite=Strict, path=/ i najviše 30 minuta (kraće ako pozivnica ranije ističe). Identitet dolazi samo iz cookie-ja: sessionId u body-ju se odbija, dupli/neispravni cookie ne otvara sesiju. /api/chat start zahteva aktivan pristup i zadržava isti token, rok i kvote. Opoziv prekida sve povezane sesije. DELETE /api/session uklanja RAM podatke i access red, briše cookie; ne briše dnevnu budžetsku evidenciju/logove. Stale revision, jedan aktivan zahtev i late-commit provera sprečavaju tiho prepisivanje. Restart gubi RAM profile; preostali cookie ne vraća izgubljeni sadržaj.

## Transport i browser

PROTOTYPE_TRANSPORT=local_http je eksplicitni loopback preview izuzetak, uključujući pokretanje production build-a lokalno. PROTOTYPE_TRANSPORT=https odbija plain HTTP, zahteva Secure cookie i tačan `PROTOTYPE_PUBLIC_ORIGIN`; wildcard i foreign origin se odbijaju. NODE_ENV=production sam po sebi ne označava odobren javni deployment. D-046 je 19. oktobra remote proverio odobreni Railway TLS proxy/origin u mock režimu; `/api/health` i root vraćaju HTTP 200 i očekivane security headere. Ne veruje se proizvoljnom `X-Forwarded-Proto` kao dokazu sigurnosti. HTTPS response dobija HSTS. Ovo je uzak preview dokaz, ne produkciona bezbednosna potvrda.

Mutacije traže tačan Origin usklađen sa validiranim Host-om; nedostajući Origin/cross-site zahtevi su odbijeni. Ovo dopunjuje Strict cookie. HTTP JSON telo najviše 40.000 bajtova, poruka najviše 8.000 znakova; strict Zod ugovori za profile/consent/AI output. React prikazuje tekst bez izvršavanja modelskog HTML-a. Nonce CSP je različit po request-u, SSR je dynamic; script-src self/nonce/strict-dynamic, bez unsafe-inline skripti u production build-u. Razvoj dozvoljava unsafe-eval, stilovi imaju unsafe-inline radi postojećeg preview-a. Object/frame/base/form ograničenja, nosniff, DENY, no-referrer i permissions camera/microphone/geolocation=() su uključeni.

## Kvote i zaštita troška

| Kontrola                  | Serverska vrednost                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Poruke po sesiji          | 40; neuspešna AI obrada validne poruke takođe troši poruku                                                                         |
| Mutacije/resume po sesiji | 30 u fiksnom minutu; postojeća memory sliding provera dodatno ograničava mutacije                                                  |
| Pokušaji redemption       | 20 globalno u fiksnom minutu, uključuje neispravne kodove                                                                          |
| Tokeni                    | 300.000 po sesiji, 2.000.000 globalno po UTC danu                                                                                  |
| Budžetski ledger          | USD 0,25 po sesiji, USD 10 globalno po UTC danu; mikro-dolari kao celi brojevi                                                     |
| Output / timeout / retry  | Integrisani mock: 1.600 output tokena, 12s total deadline, retry=0; adapter podržava najviše jedan eksplicitno retryable 429 retry |
| Aktivni AI poziv          | Jedan po sesiji; memory busy i shared SQLite hold                                                                                  |

Vrednosti su radne bezbednosne granice i testovi, **nisu odobrenje troška**. Transakcija proverava aktivan pristup, session/daily tokens/cost i rezerviše pre provider-a. Poznat validan usage oslobađa samo neiskorišćeni deo; nedostajući/prekoračen usage, timeout, crash ili istekao hold konzervativno zadržavaju maksimum. Hold ističe nakon 35s; tada se samo otključava, ne refundira. Reset profila ne resetuje brojače, brisanje ne oslobađa globalne rezervacije. Dnevni limit koristi UTC dan. BUDGET_EXCEEDED je normalizovan; deterministički browse bez objašnjenja i brisanje ostaju mogući.

Mock nema dobavljački usage: lokalni token accounting koristi konzervativni bajtni bound inputa + framing/output cap. To nije tokenizacija pravog modela. Procena stvarnog mock troška je USD 0. SpendGuard port u ledger-u rezerviše maksimalni iznos pre postojećeg Responses transporta i konzervativno settle-uje nepoznato; testiran lokalno, nije uključen u produktnu rutu. Pre budućeg live povezivanja moraju se zajedno pregledati tokens/cost guard i concurrency, aktuelne cene i odobren budžet. Živa kvota nije samo provider billing limit.

## Tajne, flagovi i podaci

Produktni tok je eksplicitno mock: environment key/live flag ne može ga prebaciti na paid provider. Nije tražen ključ; nema ključa u repozitorijumu, browseru ili logovima. Konfigurišu se samo lokalna putanja kontrolne baze i transport. Putanja ostaje u .local/.cache workspace-u; ta storage mesta i .env* su isključeni iz Next output tracing-a. Server-only granice odvajaju AI i kontrolne podatke od browser bundle-a. Lokalni OS pristup fajlovima nije zamena za izolaciju od drugih administratora računara.

securityPolicy.uploadEnabled=false i liveAiEnabled=false su zatvoreni feature flagovi. Nema file input-a za pravi dokument, /api/upload odbija body bez parsiranja/čuvanja. AI document flag je takođe false. Pravi dokumenti se ne čuvaju. UI jasno traži fiktivne detalje i prikazuje disabled upload. Katalog je verzionisan: approved published 1.0.3 ima osam programa i 26 visible unknown; pravila/izvori/alternative ostaju server-owned, a individualni bindings manual/unresolved. Ne tvrdi se da automatski screening može prepoznati sve lične podatke koje korisnik pogrešno unese.

## Pre pravog pilota

Otvoreni ostaju odgovorni rukovalac/operator, pregled obaveštenja i čuvanja/backup pristupa, hosting/TLS, odobren model/trošak, human publication, nezavisni bezbednosni pregled i evaluacija. Ovo su postojeće projektne kapije O-004/O-005/O-006/O-007, ne novi zahtev za potvrdom lokalnog rada. Koraci 11/12 nisu pokrenuti. Otvorene odluke (private development record).
