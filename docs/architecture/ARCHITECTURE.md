# Tehnička arhitektura

Datum: 2026-10-05. Osnova: Prompt 3, prema D-008/D-009 u DECISIONS (private development record). Ovo je jedna lokalna Next.js App Router aplikacija. Početni ekran i sve produktne poruke su na engleskom (D-002). Opis budućeg proizvoda nije dokaz implementacije: [SCOPE](../PROTOTYPE_SCOPE.md), [USER_FLOWS](../USER_FLOWS.md), [ACCEPTANCE](../PROTOTYPE_ACCEPTANCE.md).

## Dopuna Koraka 4: lokalni obrazovni UI

Root / je server Page koji renderuje client StudyWorkspace sa lokalnim React state-om. `src/components/study/` odvaja razgovor/profil/kartice/izvore; `src/components/ui/` sadrži reusable native kontrole; `src/app/study.css` mali dizajn sistem. `src/test-fixtures/ui-demo.ts` je javni UI-only test double, nije server katalog ili domenska schema. Nema fetch-a/persistence-a u obrazovnom toku. Potvrda/korekcija/dozvola su demonstraciono ponašanje; pravi engine ostaje neimplementiran.

Ranija dijagnostička stranica je na /technical; API/config/adapter/repository moduli i njihove granice nisu promenjeni. Tabela ispod opisuje tehničku osnovu Koraka 3; browser/component testovi sada pokrivaju i UI. [Stanja](../ui/UI_STATES.md), [dizajn](../ui/DESIGN_SYSTEM.md), [verifikacija](../ui/VERIFICATION.md). Nema dodatne zavisnosti/servisa ili promene pinovanih verzija.

## Implementirani kostur

Dopuna 2026-10-06: Korak 5 ima [lokalni normalized katalog](../data/DATA_MODEL.md), a Korak 6 [deterministički profil](../profile/PROFILE_MODEL.md) sa čistim funkcijama i offline sintetičkim replay-em. Nijedan nije povezan sa statičkim browser tokom. Tabela prikazuje module na završetku Koraka 6; opis mock transporta/pohrane ispod ostaje istorijska tehnička osnova Koraka 3.

| Putanja                             | Odgovornost i granica                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                          | Server layout/stranice, statički obrazovni UI na / i dijagnostika na /technical, CSS i HTTP rute.                                               |
| `src/components/`                   | Klijentska mock provera i lokalni Button sa Radix Slot kompozicijom. Bez provider SDK-a i serverske konfiguracije.                              |
| `src/domain/result.ts`              | Neutralni `Result<T>` i bezbedni error kodovi; Zod error ugovor.                                                                                |
| `src/features/profiles/`            | Korak 6: strict profil/events, transitions, zlatna pitanja i readiness; legacy diagnostic tip ostaje kompatibilan. Bez NLP-a/UI integracije.    |
| `src/features/catalog/`             | Strict normalized schema/provenance i repository port; original staging 8 partial programa, approved published 1.0.3 ima svih osam programa.    |
| `src/features/matching/`            | Korak 7: strict matching/ranking/consent domen; legacy mock port očuvan. UI integracija ostaje buduća.                                          |
| `src/features/ai/`                  | Dijagnostički ugovor i novi strict provider-neutral AI ugovor Koraka 8.                                                                         |
| `src/server/config/`                | Zod validacija i server-only čitanje allowlist promenljivih. Jedini podržani režim je `mock`.                                                   |
| `src/server/ai/`                    | Server-only dijagnostika i novi Responses provider/education adapter; mock default, bez live poziva ili SDK zavisnosti.                         |
| `src/server/catalog/`               | Prazan stateless mock repository; nema izmišljenih ustanova/programa.                                                                           |
| `src/test-fixtures/`                | Minimalni vidljivi ulaz SYN-UG-01 iz [fixture specifikacije](../test-fixtures/SYNTHETIC_PROFILES.md). Bez skrivenih odgovora i ličnih podataka. |
| `tests/`                            | Vitest unit/integration/component i Playwright; obrazovni UI testira sintetički tok bez AI-ja, baze i poslovnog matchinga.                      |
| `scripts/check-server-boundary.mjs` | Pravi negativni Next build nad tačnom kopijom konfiguracionog izvornog koda; privremeni izolovani fixture u `.cache/`.                          |

Tipovi u `features/` su početna mesta za kasnije ugovore, ne kompletna domen schema. Nema monorepo-a, mikroservisa, dodatnog backend-a, agentskog frameworka, vektorske baze, Redis-a ili Kubernetes-a. Ručna inicijalizacija čuva ranije dokumente/PDF u istom korenu; generator nije prepisivao postojeći folder.

Next 16.3 dev server može automatski dodavati agent instrukcije. `agentRules: false` u `next.config.ts` isključuje taj side effect i čuva projektnu AGENTS osnovu. Provereno u verzijski usklađenom `node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`; privremeno dodat generisani blok je uklonjen, originalna pravila ostaju. Ova opcija ne isključuje čitanje aktuelne dokumentacije.

## Aktuelne verzije i razlog izbora

Verzije su proverene 5. oktobra u zvaničnoj dokumentaciji i npm registru, pinovane u `package.json` i `package-lock.json`. Nisu prepisane iz PDF-a.

| Alat                                | Verzija                    | Razlog                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js / npm                       | Provereno 24.19.0 / 11.6.4 | Node 24 je projektni runtime, `engines` ograničava major; npm je već dostupan i nema postojećeg managera/lockfile-a. `npm ci` koristi lockfile.                                                          |
| Next.js / React / React DOM         | 16.3.8 / 19.3.0 / 19.3.0   | Jedan App Router server i UI, međusobno usklađeni peer zahtevi.                                                                                                                                          |
| TypeScript                          | 6.0.3                      | Strict, dodatno unchecked indeks i exact optional polja. TS 7.0.2 nije podržan u izabranom typescript-eslint opsegu `<6.1.0`, pa nije zadržan.                                                           |
| Tailwind / PostCSS plugin / PostCSS | 4.3.3 / 4.3.3 / 8.5.29     | Zvanični Next PostCSS tok, bez dodatnog CSS framework-a. System font ne zahteva mrežu tokom build-a.                                                                                                     |
| Radix Slot                          | 1.3.3                      | Minimalna lokalna kompozicija UI primitive umesto shadcn CLI-a/šireg kompleta u tehničkom kosturu. Semantika/fokus/disabled ostaju native button.                                                        |
| Zod / server-only                   | 4.6.5 / 0.0.1              | Runtime ulaz/izlaz/config validacija i build granica servera.                                                                                                                                            |
| Vitest / Vite                       | 5.0.3 / 8.3.2              | Node test runner za server logiku, kompatibilni peer/runtime zahtevi.                                                                                                                                    |
| Playwright                          | 1.63.0                     | Browser smoke; podrazumeva svoj Chromium, podržava postojeći Edge kroz eksplicitni `PLAYWRIGHT_CHANNEL=msedge`.                                                                                          |
| ESLint / Next config                | 9.39.5 / 16.3.8            | ESLint 10.12.0 nije kompatibilan sa import/react/a11y pluginima Next config-a; zadržan kompatibilni 9. ESLint 9 je označen kao nepodržan upstream, što ostaje tehnički dug za usklađeno naredno izdanje. |
| Prettier                            | 3.9.9                      | Jednostavan formatter; raniji dokumenti/izvori su izuzeti radi očuvanja.                                                                                                                                 |

Tipovi: `@types/node` 24.19.1, `@types/react`/`@types/react-dom` 19.3.0. Nema globalne nadogradnje alata, `--force` ili zaobilaženja peer zahteva. Git/GitHub nisu postojali; nema push-a ili CI workflow-a za nepostojeći remote. Verzionisanje ostaje Q-S03; izvori i nepovezani dokumenti se proveravaju kontrolnim sumama.

## HTTP i konfiguracija

- `GET /api/health`: 200 za validan mock režim; 503 i bezbedna poruka za nepodržani režim. Nema detalja okruženja.
- `POST /api/mock`: samo `application/json` sa `{ "fixtureId": "SYN-UG-01" }`. Strict Zod odbija nepoznati ID/dodatna polja, nevalidni JSON daje 400, drugi content type 415. Uspeh vraća validiran `Result` sa mock oznakom, `synthetic: true`, praznim katalogom i fiksnom engleskom dijagnostičkom porukom. Konfiguracioni problem 503; nevalidan izlaz/kvar 500, bez echo-a/stack-a.
- Browser proverava neutralni izlazni ugovor i HTTP status, bez modelskog HTML-a. Greška ima bezbednu poruku i retry dugme, bez logovanja ulaza.
- `.env.example` sadrži samo opcioni `APP_MODE=mock` i isključenu Next telemetriju. App radi i bez `.env.local`; nema obaveznih tajni. `APP_MODE=live` i sve druge vrednosti se odbijaju.
- `getServerConfig()` čita samo APP_MODE, iza `server-only`; nema `NEXT_PUBLIC_*` ključa niti `next.config.env`. Buduće tajne se dodaju samo u taj sloj nakon odobrenja realne integracije. Ne čitaju se niti prosleđuju proizvoljne promenljive.

## Planirani slojevi i pohrana

PostgreSQL/Supabase je planirani relacioni sloj (A-004), iza repository ugovora. U ovom koraku nema klijenta baze, migracija, persistence-a, cookies/localStorage-a ili sesijskih ID-jeva. Mock repository vraća prazan niz; reload ne vraća profil, jer profilni tok još ne postoji. Ne koristiti process-global mutable map kao buduću zamenu za izolovane sesije. Schema kataloga dolazi u 5, profil u 6, pravila u 7, sesijska pohrana/izolacija/retention i oporavak u 10/11.

Korak 8 sada implementira OpenAI Responses HTTP provider iza neutralnog ugovora, nakon provere zvaničnih API/model/pricing izvora; live slanje i budžet nisu odobreni. UI i domen ne uvoze OpenAI SDK i ne znaju provider response format. Početni dijagnostički ugovor ostaje isti, a obrazovni AI ugovor je zaseban i ima fake/mock testove; produkcione sesije/kvote i pilot nisu završeni. Izlaz se validira i proverava prema stvarnom katalogu i pravilima; validan JSON nije dokaz tačnosti. Hosting/cloud nalog čekaju O-006. Nema pravog upload-a, registracije ili naplate.

## Zvanični izvori izbora

[Next instalacija](https://nextjs.org/docs/app/getting-started/installation), [server/client granice](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Tailwind za Next](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Radix Slot](https://www.radix-ui.com/primitives/docs/utilities/slot), [Zod](https://zod.dev/), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [Playwright browseri](https://playwright.dev/docs/browsers), [typescript-eslint kompatibilnost](https://typescript-eslint.io/users/dependency-versions/).

Stvarne rezultate/ograničenja čitati u [VERIFICATION](VERIFICATION.md); detalje konteksta i granica u [CONTEXT](CONTEXT.md) i [TRUST_BOUNDARIES](TRUST_BOUNDARIES.md).

## Dopuna Koraka 7

Čisti feature moduli ne uvoze server/Node ni AI dobavljača. Novi `src/server/matching/catalog-adapter.ts` čita samo fiksni published JSON i koristi postojeći validator; nema mreže/upisa/promocije. Native offline CLI radi bez bundler JSON import-a. [Algoritam](../matching/ALGORITHM.md), [dokaz](../matching/VERIFICATION.md). UI/mock/profil/katalog postojeći ugovori ostaju odvojeni; nema javnog matching endpoint-a ili session grant autentifikacije.

## Serverski AI adapter — Korak 8

[Ugovor](../ai/AI_CONTRACT.md), [dokaz](../ai/VERIFICATION.md). Novi neutralni schema je u src/features/ai/schema.ts; postojeći contracts.ts ostaje kompatibilna mock dijagnostika. src/server/ai/education-factory.ts bira internal mock ili jedini OpenAI HTTP provider; server-only marker i poseban negativni build štite novi transport. Source/profil/matching ostaju nezavisni od API formata; nema novih paketa ili javne rute. `.env.example` sadrži samo bezbedne modele/false zastavice. Live guard, sesije i UI integracija imaju svoje kasnije kapije.

## Dopuna Koraka 9 — aktuelni lokalni tok

Root / sada renderuje ConversationWorkspace i koristi šest novih lokalnih ruta; prethodni opisi bez fetch-a/persistence-a odnose se na istorijski kostur i sačuvani /preview. `src/features/conversation/` je neutralni strict HTTP/view ugovor; `src/server/conversation/` čuva local cookie sessions/scenarios/orchestrator/http gate. Profil/matching/AI ugovori iz 6–8 se koriste bez refaktora ili provider formata u UI-ju. Single-process mutable store je izričita lokalna mock adaptacija Prompta 9, a ne buduća produkciona pohrana. D-022; [kompletan ugovor i ograničenja](../integration/CONTRACT.md), [dokazi](../integration/VERIFICATION.md). Prod session/privacy/invitations/global quotas i hosting ostaju 10/12.

## Kontrolni sloj Koraka 10

src/server/security/control.ts koristi Node SQLite za invite/session hashes, kvote, atomske rezervacije i metadata. RAM profil ostaje vezan za jedan app proces; shared counters nisu distributed profile persistence. Putanja samo pod .local/.cache workspace-a. BEGIN IMMEDIATE/active recheck i conservative unknown settlement sprečavaju double spend. Master PostgreSQL pravac ostaje buduća odluka D-024. Proxy nonce/dynamic SSR, Origin/Host/cookie guard i default loopback bind zatvaraju lokalni tok. [Osnova](../security/SECURITY_PRIVACY_BASELINE.md), [dokazi](../security/VERIFICATION.md).
