# Synthetic demonstration profiles

`phase1-demo-1`, 2026-10-11. Seven fictional adult-review examples, without names, contacts or real applicant records. Executable values: [demo-profiles.ts](../../src/test-fixtures/demo-profiles.ts); [session fixtures](../../src/server/conversation/fixtures.ts).

## Shared values

Computing / Computer science, DE/NL preferred countries, no excluded countries, English teaching language, intake 2027, **10000 EUR/year including living costs**. Firm country/language/budget constraints apply. Bachelor qualification: completed general secondary education in RS, 2026; credits unknown. Scholarship preference is preferred except the PhD required-funding case. Example values are proposals until confirmed; optional unknowns are not invented.

Fictional identity/cost source dates include 2026-10-06; explicit qualification/ECTS/subject/funding fixtures include 2026-10-08. Read the displayed source date; neither is today's official web retrieval or human review. Evidence has no real official URL.

| ID     | Exact Demonstration label / scenario           | Specific values / input                                                                                 | Expected                                                                                                |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D12-01 | Bachelor's study / bachelor                    | Secondary qualification; annual hard budget 10000                                                       | options_found, synthetic-computing + synthetic-software, 2 cards                                        |
| D12-02 | Master's study / master                        | CS bachelor, RS, completed 2026, 180 ECTS; Algorithms and Linear algebra, marks/subject credits unknown | needs_verification, 1 master; self-report only likely_met                                               |
| D12-03 | Funded PhD / phd                               | Completed CS master, fully_funded, employed_position, reliable computing topic, required scholarship    | Before grant 0 cards/permission_required; after grant 1 conditional PhD, funding/fit/employment unknown |
| D12-04 | No matching programme / no_match               | Computing profile, medicine-only fixture                                                                | NO CATALOG MATCH, 0 cards                                                                               |
| D12-05 | Above-budget alternative / alternative         | Hard budget 10000 vs synthetic cost 12000 EUR/year                                                      | Identity hidden before grant; 1 conditional card after grant; 0 after withdrawal                        |
| D12-06 | Bachelor's study / bachelor, fresh start       | Confirmed 10000; My budget is 7000 EUR                                                                  | PROFILE CONFLICT, both candidates, stale cards removed                                                  |
| D12-07 | Explanation unavailable / provider_unavailable | Deliberately failing simulated explanation                                                              | PROVIDER UNAVAILABLE; explicit Browse without explanation gives 2 cards                                 |

## Shared start and end

Open local `/`, select the scenario, privately enter Invitation code, confirm adult status and notice agreement, Start demonstration. Observe staged questions before Review example details. Inspect/edit fields, then Confirm these details. End and clear session between examples; each restart redeems another use. Ordinary tabs share cookies; session-isolation tests use independent browser contexts.

## Exact tasks and oracles

### D12-01 — budget, correction and sources

Find programmes → two cards. View sources for Synthetic computing bachelor → source ID, check date, fictional notice and next step. Edit Budget amount → 11000 → Save answer → Confirm these details; old cards disappear before searching again. Find programmes → two cards. Budget changed only through explicit editing/confirmation, never permission/model output. Loading a preset is not general NLP extraction.

### D12-02 — prerequisite subjects

The initial master example omits Previous qualification; search stays unavailable. Answer Previous qualification: bachelor, Computer science, RS, completed, year 2026, 180 ECTS. Save/confirm/search → one option with prerequisite subjects **unknown**. The existing Relevant subjects form is now accessible even while missing, without silently making that information known.

Answer Relevant subjects → `none` → save/confirm/search: known absence excludes the mandatory subject rule, zero cards. Edit Relevant subjects → `Algorithms, Linear algebra` → save/confirm/search: one master, subjects **likely met**, institution must confirm. A partial list stays unresolved. Open master sources and read warnings/next step. This rule is purely fictional and is not a real institution's admissions condition.

### D12-03 — funded position

Find programmes → no named card and a scoped permission request. Allow this alternative → Conditional alternative / SOURCE UNVERIFIED. Open PhD sources and identify unknown funding, supervisor, research fit and employment. Required funding stays required; permission cannot create a funded position.

### D12-04 — no match

Find programmes → NO CATALOG MATCH and zero cards. Explain the limited catalogue; don't conclude no university anywhere offers the subject. The existing Reviewed real catalogue scenario independently returns zero published real programmes without staging/synthetic fallback.

### D12-05 — permission and withdrawal

Find programmes → zero named cards. Read the budget deviation. Allow this alternative → one conditional option; inspect sources, budget still 10000. Withdraw alternative permission → card and source access disappear. Permission is scoped to the option/profile revision; edits clear it and institutional rules are never waived.

### D12-06 — conflict

Search a fresh confirmed bachelor example. Send exactly `My budget is 7000 EUR`. See PROFILE CONFLICT, no old cards and disabled search. Keep 10000 explicitly → Find programmes → two cards. Choosing 7000 legitimately has a different result. The supported short phrase demonstrates conflict wiring, not general free-text understanding.

### D12-07 — recovery

Find programmes → PROVIDER UNAVAILABLE, zero cards. Browse without explanation → two cards selected by the same rules. No real provider outage, API charge or silent replacement is implied.

[Browser rehearsal](../../tests/e2e/demo-rehearsal.spec.ts), [script](DEMO_SCRIPT.md), [tester instructions](TESTER_INSTRUCTIONS.md). Every count is bounded by three; fabricated real institutions/sources or waived mandatory conditions are unacceptable.
