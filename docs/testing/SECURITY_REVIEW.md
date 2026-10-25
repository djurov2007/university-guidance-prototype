# Bezbednosni pregled — Korak 11

2026-10-11; interni pregled Codex-a, lokalni mock obim. [Pretnje](../security/THREAT_MODEL.md), [retention](../security/LOGGING_RETENTION.md), [baseline](../security/SECURITY_PRIVACY_BASELINE.md), [QA](QA_REPORT.md). Nije nezavisni pentest/security sertifikacija.

## Release blocker matrica

| Rizik iz Prompta 11               | Provera i stvarni ishod                                                                                                                                  | Zaključak za omogućeni tok                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Curenje podataka                  | HTTP strict bodies, safe errors, log allowlist, SSR/client trace, session deletion; tests PASS                                                           | Nema poznatog otvorenog blocker-a; realni podaci nisu obrađeni |
| Izložen API ključ                 | Produkcioni mock build sa fake server-key sentinel-om; 16 client fajlova bez sentinel/OPENAI_API_KEY/provider/sqlite/key-shape, dva negative builds PASS | Nema pronađenog ključa/serverske implementacije u client-u     |
| Session isolation                 | 2 browser contexts, foreign body/cookie/Origin, delete/revoke/expiry, quotas across connections PASS                                                     | Tuđi body ID ne bira session; bearer cookie je access granica  |
| Izmišljeni institucionalni podaci | Strict selector/IDs, invented source/program/intake/deadline negativni testovi x3, exact sources PASS                                                    | Mock kartice jasno fictional; realni published empty           |
| Hard limit bypass                 | Wrong level/field, mandatory qual/deadline/funding excludes; language/country/budget zahteva scoped consent; revoke+sources denial PASS                  | Permission ne ukida ustanovu; profil budget ne menja           |
| Nekontrolisana potrošnja          | Atomic reserve/session/day token+cost/message/rate/concurrency, settlement/unknown charge/reopen/reset/deletion PASS                                     | Fake-only, nula pravih poziva; live product slanje disabled    |
| Aktivan nebezbedan upload         | /api/upload odbija, browser disabled PDF, document adapter off bez provider call PASS                                                                    | Rizična funkcija isključena                                    |
| Neponovljiv glavni demo           | 27 browser testova na production build-u, ponovljeni main flow/keyboard/sources/delete PASS                                                              | Ponovljiv lokalni invited synthetic tok                        |

Known enabled-flow blocker: **0** u proverenom skupu. Odsustvo poznatog problema nije dokaz apsolutne zaštite. Adult/notice gate nije potvrda identiteta ni pravne osnove stvarnog pilota.

## Pregled koda i podataka

Control ledger čuva hash pozivnica/bearer-a, bounds i minimalne logs, profil ostaje RAM/30min. Persistent quota/use evidencija ne resetuje se brisanjem profila. Proverene su odvojene SQLite konekcije i reopen, ne distributed produkciona sesija. Failure/late revoke ne sme commit-ovati profil. HTTP Origin+Host/local transport ne prihvata body token; bounded JSON read i strict Zod odbijaju extra fields. Nonce CSP/Cookie/headers provereni realnim browser-om; HTTPS Secure/rejection lokalnim Request testovima, **javni TLS/proxy NOT RUN**. Stolen valid bearer/local-machine compromise nije pokriven kao jaka identity zaštita.

AI input/output ugovor i katalog IDs ostaju serverski. Heuristički unsafe screening nije potpuna NLP zaštita; modelski JSON nije fact dokaz. Source/fact IDs i relevantni intake ostaju controlled; izvorni PDF/read-only katalog nisu menjani. `catalog:check` na 2026-10-11: staging 8 programa/28 izvora/142 facts, 26 warnings, 0 validator issues; published 0. Strukturni integritet **PASS**, ljudska tačnost/godina/candidate applicability **BLOCKED**, bez nove web fact revalidacije ili publikacije.

`check-client-bundle.mjs` traži poznate fake sentinels, key shape i server markers, pregleda nft trace za .local/.cache/.env. PASS 16 static fajlova/17 trace inventara; ovo je ciljana provera, ne univerzalni secret scanner. Ključ nije tražen u chatu ili učitan radi pregleda. Trace ne uključuje runtime baze/pozivnice; cache QA nema njihovog plaintext-a u izveštajima. Golden HTTP import u native Node CLI koristi samo Next extension resolver; ne menja security provere.

## Aktuelni dependency nalaz

Svež npm registry audit 2026-10-11: **FAIL 5 high, 0 critical** kroz dev-only `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. Produkciono `--omit=dev`: **PASS 0** prijavljenih ranjivosti. Jedan osnovni advisory sa zavisnim paketima nije pet nezavisnih exploita.

[GitHub advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) opisuje stack exhaustion na duboko ugnježdenim brace patterns, pogođen braces ≤3.0.3 i bez navedene patched verzije u proveri. npm predlaže major downgrade ESLint config-a na 14.2.35; to nije validirana kompatibilna popravka za Next 16. Package-lock/dependencies nisu menjani; nema audit --force. Interna procena: prihvaćeno ograničenje samo za trusted-local razvoj, jer korisnički chat/input ne dospeva do ESLint glob parsera; nema nepoverljivog CI lint workload-a ili javnog servisa. Rizik razvoja ostaje otvoren KI-01; pre promene operativnog obima proveriti fix i ponoviti sve checks. Ovo nije potvrda da build toolchain nema druge slabosti.

## Nepotvrđeno i kapije

Live provider/model behavior i stvarno accounting/reconciliation **BLOCKED** O-004; realni upload/data retention/pravno/security reviewer **BLOCKED** O-005/O-007; cloud/public TLS/HA/load test **BLOCKED** O-006. Nezavisni penetration test, fizičko brisanje/backup secure erase, potpuna supply-chain analiza **NOT RUN**. Lokalni cleanup/reopen tests ne predstavljaju disaster restore drill. Zatvorene funkcije ne moraju dobiti lažni PASS da bi uski lokalni korak bio završen. [KNOWN_ISSUES](KNOWN_ISSUES.md) vodi vlasnike i kriterijume ponovnog otvaranja.
