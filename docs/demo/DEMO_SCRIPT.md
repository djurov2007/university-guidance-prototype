# Demonstracioni scenario

Post-closeout napomena 2026-10-17: published 1.0.3 sada ima osam human-reviewed programa; synthetic demo koraci ispod ostaju fiktivni i ne predstavljaju pilot ili individualnu admissions procenu. [Završni status](../PHASE_1_CLOSEOUT.md).

`phase1-demo-1`, 2026-10-11. Samo lokalni English-only mock i fiktivni podaci. [Profili](DEMO_PROFILES.md), [startup/checklist](RELEASE_CHECKLIST.md), [backup](FALLBACK_PLAN.md).

## Priprema

Pokreni production build/start na loopback-u, napravi bounded pozivnicu sa 8 upotreba i privatno pročitaj kod. Sedam novih primera troši sedam redemption-a; za dodatnu probu planiraj broj unapred. Proveri root i health, pozivnicu i backup pre sastanka. Ne prikazuj operator fajlove, bazu, konfiguraciju, devtools ili prave dokumente. Običan drugi tab nije druga sesija: tabovi dele cookie.

Glavni pitch traje okvirno 3–5 minuta: živi bachelor tok i jasno označene snimljene dopune. Za sve profile uživo ostavi okvirno 15–20 minuta; to je plan vremena, ne izmeren rezultat korisnika. Rezervni snimak prikazuje stvarnu automatizovanu browser probu, bez naracije.

## Scenario od približno 4:30

| Vreme     | Način / radnja                                                                | Govorni tekst na engleskom / dokaz                                                                                                                                |
| --------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | Uvod / notice                                                                 | “This local prototype uses fictional programmes and simulated explanations. The reviewed real catalogue is empty.”                                                |
| 0:20–0:55 | LIVE Bachelor's study; invitation/start; pitanja pre Review                   | “Missing information is asked for. I will review a labelled fictional example, not a real student's biography.”                                                   |
| 0:55–1:25 | LIVE Review example details → Confirm these details → Find programmes         | “Deterministic rules selected two synthetic options within the confirmed budget and teaching-language constraints. No admission probability is shown.”            |
| 1:25–1:55 | LIVE Edit Budget amount → 11000 → Save answer → Confirm; search; View sources | “An edit invalidates results and permissions. This source ID and check date belong to fictional evidence, not an official university source.” Pročitaj next step. |
| 1:55–2:25 | LIVE My budget is 7000 EUR; conflict; Keep 11000; search                      | “The conflict requires an explicit choice. A hard limit cannot be silently replaced.” Ova varijanta čuva 11000 posle ranije ispravke.                             |
| 2:25–2:40 | LIVE Tell me the weather → Send message                                       | “An unrelated request stays outside scope; the study profile remains intact.”                                                                                     |
| 2:40–3:05 | RECORDED master 04/05 i PhD 06                                                | “Self-reported prerequisite subjects are only likely met. PhD funding, supervisor and employment remain unknown even after permission.”                           |
| 3:05–3:25 | RECORDED no-match 07 i alternative 08/09                                      | “An empty result is honest. An above-budget alternative stays hidden until specific permission, and withdrawal removes access.”                                   |
| 3:25–3:50 | RECORDED provider failure/recovery 11/12                                      | “Failure is visible. Browse without explanation is an explicit deterministic choice using the same rules.”                                                        |
| 3:50–4:10 | LIVE End and clear session                                                    | “The RAM profile is cleared; minimal operational and budget records have separate retention.”                                                                     |
| 4:10–4:30 | Konkretan ask                                                                 | “Could you spend 15 minutes critiquing our data-review approach and introduce one admissions or data-quality reviewer?”                                           |

Vremena su speaker raspodela, ne obećanje završetka zadatka. Snimak/screenshot jasno nazovi recorded rehearsal; ne tvrdi da kontaktira trenutno pokrenut server ili pravi model. Ako sagovornik želi sve uživo, koristi korake iz DEMO_PROFILES i produži termin.

## Obavezne granice

Do tri kartice je maksimum: ovaj bachelor daje dve, master jednu, no-match nula. “likely met”, “unknown” i “Conditional alternative” nisu admission/funding potvrda. Datumi fixture-a nisu današnja official web verifikacija. Realni published je prazan; staging human review PENDING. Engleski UI i jezik nastave programa su zasebne stvari.

Ako proba zapne, koristi [fallback](FALLBACK_PLAN.md) i reci šta nije dostupno. Ne menjaj security guard, kvote, evidence ili rezultate u letu da bi demo izgledao uspešno.
