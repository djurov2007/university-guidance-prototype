# Verifikacija Koraka 8

Istorijski dokaz tog koraka. Aktuelna integracija/sesije su u [Koraku 9](../integration/VERIFICATION.md); statički UI ostaje /preview, root / koristi lokalne rute.

Datum 2026-10-06. Status: **PASS — lokalni AI adapter, fake/mock i serverske granice**. Plan (private development record), [ugovor](AI_CONTRACT.md), [14 izvršenih scenarija](SCENARIOS.md).

## Implementirano i provereno

Neutralni strict Zod AI ugovor, sedam public tipova, scoped profile proposals i staging bez overwrite-a, serverski scope/context/grounding, jedan OpenAI Responses HTTP provider i fake/mock provider. Provider ne bira katalog/rules/consent; serijalizuje samo kontrolisani kontekst. Model/instruction/schema/provider verzije, request IDs, usage/nullable dated cost, total timeout, bounded rate-limit-only retry i normalizovane greške.

Završni run: **236 testova u deset fajlova PASS**, 152 ranija + 84 nova. Završni `npm run typecheck`, `npm run lint`, production `npm run build`, postojeći `npm run test:boundary` i novi `npm run test:ai-boundary` imaju izlaz 0. Završni npm run format:check ima izlaz 0 posle korekcije formatiranja jednog testnog fajla. Svih 14 offline scenarija ima očekivani tip odgovora; nula mrežnih/plaćenih API poziva. Testovi HTTP transporta koriste fake fetch i izmišljenu sentinel credential vrednost; to nije stvarni ključ niti API poziv.

Negativni Next build za postojeći server config PASS. Novi AI boundary prvo je ispravno odbio server-only import ali ga Next izvan App Router stabla označio kao Pages Router, pa stroga očekivana Client Component provera nije prošla. Fixture zatim kopira iste source module pod App Router; ponovljeni check odbija Client Component import stvarnog OpenAI provider source-a i ima izlaz 0. Originalni app source ne menja se. CLI prvo nije radio jer Node native strip-only ne podržava TypeScript parameter properties; constructor je promenjen u eksplicitne properties, bez novog paketa. Ponovljeni oba demo režima prošli.

## Pokriveni slučajevi

Ispravan izlaz; nevalidan JSON; nepostojeći/skriveni/reordered program/intake; nepostojeći ili existing ali unbound source; nedozvoljena polja i izmišljeni rok/cena/procenat; nepotvrđeni i stale profile proposals; unknown nije confirmed match; institutional failure nema waiver; question task/kontekst i English-only templates; preduga/stale/extra/task request; prompt injection/script/secret/unrelated screening; model refusal/incomplete; timeout; HTTP 429/401/403/400/5xx/redirect/network; bounded body/usage/model/version; no tools; current/expired price, approval/key/guard/reservation/cost gate i unknown settlement. Svi referentni slučajevi su sintetički.

## Neprovereno i otvoreno

**Live API NOT RUN: 0 poziva, usage od pravog modela nije dostupan, plaćeni trošak USD 0.** Nema potvrde model/account access-a, tačnosti NLP-a, latency-a ili fakture. Regex screening nije potpuna semantička zaštita; quoted proposals nisu istina. Slobodna faktografska modelska proza nije podržana; sve prikazne činjenice dolaze iz determinističkog rezultata.

Browser/E2E NOT RUN za Korak 8, jer UI/rute nisu menjani. Nema javnog AI endpoint-a, sesija/auth/distribuiranih kvota, pilot/cloud/deploy-a ili upload-a. SpendGuard je obavezni port bez produkcione implementacije, pa live factory bez guard-a ostaje zatvoren. Document flag false; true nije omogućeno. Published nula i human review PENDING. Raniji lint dependency/audit dug ostaje u [arhitekturnim dokazima](../architecture/VERIFICATION.md); nov audit nije izvršen.

## Očuvanje i završne provere

Baseline 114 fajlova, nema Git-a. PDF, katalog/profil/matching/UI/dijagnostika i lockfile ostaju neizmenjeni. Inventar: 131 autorski fajl, 17 novih, deset namernih dokumentacionih/config dopuna, nula obrisanih. Nepovezani fajlovi imaju iste SHA-256 kontrolne sume; PDF: `727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84`. Završno provereno svih 362 relativnih Markdown linkova/odredišta sekcija. Kontrolni izveštaj u ignorisanoj `.cache/prompt8-preservation-links.json`. Originalni prompt iz Downloads samo pročitan; izvori nisu menjani.
