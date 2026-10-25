# Osnovni accessibility pregled — Korak 11

2026-10-11. Edge/Chromium engine preko Playwright-a na stvarnom Next production serveru; [test](../../tests/e2e/qa-accessibility.spec.ts). Interni osnovni pregled, bez WCAG sertifikacije. [QA](QA_REPORT.md), [ograničenja](KNOWN_ISSUES.md).

## Izvršeno

| Oblast / ulaz                  | Očekivano                                                                                      | Stvarni rezultat                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Struktura gate/profile/results | lang=en, jedan main i h1, aktivna input/select/textarea imaju label/aria name                  | PASS devet stanja, 0 unnamed controls                                                                                               |
| Viewports                      | 320/390/1280 × 900, bez horizontalnog scroll-a                                                 | PASS u gate, profile i sources-open results; raniji E2E pokriva ostale scenario/mobile tokove                                       |
| Tastatura                      | Skip link, invitation/adult/notice, review/confirm/search/sources/end dostupni Tab/Space/Enter | PASS kompletan tok bez click/focus pomoći; loop najviše 100 Tab, nema zabeležene trap                                               |
| Fokus                          | Skip prenosi na main; svaki aktivirani dugmić ima outline ≥2px                                 | PASS stvarni focus-visible 3px pri keyboard navigaciji                                                                              |
| Odabrani solid text kontrast   | Minimum 4.5:1 normalan, 3:1 veliki tekst                                                       | PASS 402 merenja kroz devet stanja; najniži 5.46:1; nije audit svakog px/hover/icon                                                 |
| Greške i dynamic messages      | Alert/status/log semantika, korisnik može retry/resolve                                        | PASS postojeći invalid transport/amount/conflict E2E i pregled role=alert/status/log aria-live; screen-reader izgovor nije testiran |
| Vizuelni pregled               | Čitljive kartice/form/notice i sources, bez preklapanja                                        | Pregledani actual desktop gate i mobile gate/results screenshot-i; bez novih UX/CSS izmena                                          |

Kontrast sampler meri trenutno izračunate boje odabranih vidljivih h1/h2/h3/p/small/pill/button/status/step elemenata sa neprozirnim solid foreground/background. Preskače disabled opacity, zatvorene details i nepouzdane gradient/alpha kombinacije; ne glumi njihov PASS. Broj merenja: desktop 8/52/76, mobile 320 7/51/75, 390 7/51/75. Ponavljanje istih boja u više stanja je regresija, ne 402 različita WCAG kriterijuma. Gate mobile ima 7 eligibility elemenata, pa je početni pogrešan uzorak >8 ispravljen bez spuštanja contrast praga.

Screenshot-i i JSON su u ignorisanom `.cache/testing/qa-{320,390,1280}-{gate,profile,results}.png` / `a11y-*.json`. Mobilni sadržaj je dug i složen ali linearan; test potvrđuje pristup, ne razumevanje/efikasnost kod stvarnog korisnika. Ostaje English-only, jezik nastave je posebno profilno polje.

## Nije izvršeno / granice

**NOT RUN:** NVDA/JAWS/VoiceOver, stvarni screen-reader announcements/focus continuity tokom async promene, 200–400% zoom/reflow, touch/motor assistive uređaji, forced-colors/high-contrast OS režim, Safari/Firefox/iOS/Android, puna WCAG 2.2 AA revizija ili realni korisnici. DOM labels i live regions nisu dokaz da svaki čitač radi očekivano. Non-text contrast/control boundaries, hover i kompletan target-size audit nisu u ovom osnovnom uzorku. Ove oblasti ostaju KI-06 i pre šireg izdanja traže namensku proveru.

U izvršenom osnovnom pregledu nema otvorenog neuspešnog testa; scope-limited PASS ne ukida ove NOT RUN stavke.
