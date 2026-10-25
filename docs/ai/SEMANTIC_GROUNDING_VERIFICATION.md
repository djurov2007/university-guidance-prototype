# Offline semantic grounding verification

2026-10-15, D-034. User request: run the offline semantic/proposal test after D-033. **No additional paid API attempt.** Current real ledger remains two attempts / USD 0.002024 accounted, combining the old unknown reserve and rounded usage estimate.

## Reproduced defect and targeted correction

Synthetic test input is the same text used by the one-call runner:

> I want to study computer science. My annual tuition budget is 9000 EUR.

A synthetic structurally valid response proposes `fieldOfStudy=computer science`, `budgetAmount=9000`, `budgetCurrency=EUR`, and `budgetPeriod=year`, with exact message substrings as evidence. The period's quote is `annual`.

Before the correction, the literal `year` fixture passed, while this explicit `annual` fixture failed with INVALID_OUTPUT. This was an actual executed failure in `semantic-grounding.test.ts` (one failed / one passed), not an inferred live payload.

The old scalar rule required the normalized value `year` to appear literally in the quote. The correction is limited to `budgetPeriod`: a small deterministic English vocabulary recognizes explicit month/year/whole-degree labels while preserving exact substring evidence and the existing profile value schema.

| Canonical value | Explicit supported labels                                                 |
| --------------- | ------------------------------------------------------------------------- |
| `month`         | month, monthly                                                            |
| `year`          | year, yearly, annual, annually, per annum                                 |
| `total_degree`  | total degree, whole degree, entire degree, total programme, total program |

The quote must identify exactly one canonical period. Mixed periods, negation markers, semester/biannual/unknown text, period-free numeric evidence, absent quotes and year/month/whole-degree mismatches are rejected. No money conversion, missing-unit inference, invented currency or automatic profile confirmation was added. Other scalar fields retain their previous grounding rules. This is deliberately limited lexical support, not general natural-language accuracy.

The old live response was not retained. Therefore the period mismatch is a proven offline defect and a plausible contributor; **it is not established as the cause of D-033 or D-031**. Future valid model output may still fail a different existing rule, now identified precisely.

## Specific private diagnostics

SEMANTIC_SELECTION_REJECTED now carries an allowlisted `rule`, optional known profile `field`, and optional `proposalIndex` from 0 to 7. No proposed value, quote, arbitrary source ID, raw model content or credential is stored. Context is only valid for this semantic reason; index requires field and field requires rule. Legacy events without these keys remain valid.

Every existing semantic rejection branch now has a specific code: duplicate proposals/permissions; invalid response-type/task coupling; inactive field; absent quote; invalid value JSON/schema; unsupported number/string/boolean/period evidence; unknown question; mismatched permission/selection count; wrong program or order; duplicate or forbidden reason/source; unverified recommendation; hidden existing options; missing answer key. These operational details remain private to the ledger and operator report. The public AI/session/UI contract is unchanged.

## Verification evidence

- 64 added test cases: 62 semantic adapter/privacy fixtures plus two full fake HTTP/conversation/ledger/confirmation cases. Full suite **488/488**, 17 files.
- Reproduced original literal-label defect before editing the validator; the same fixture passes after correction with four unconfirmed proposals.
- Valid annual/year, month and whole-degree labels pass. Ambiguous, negated, unsupported and mismatched labels fail atomically; no partial proposals are staged.
- Specific rejection fixtures cover source/program/reason/permission/task/profile/quote/value failures. Unverified institutional checks cannot be relabelled as verified by the model.
- Full fake HTTP integration checks both successful annual staging plus explicit confirmation and a rejected mismatched period with private rule/field/index. Usage of the rejected fake response is still accounted; semantic rejection does not zero the cost.
- Diagnostic injection, arbitrary fields/values, inconsistent context and out-of-bounds positions are rejected. Raw payload and new diagnostics do not appear in public session/AI output.
- Golden evaluation **50 cases / 78 executions PASS**. Build, typecheck, lint, format, AI server-only boundary and client scan PASS (16 client files, 17 traces, no unsafe hits). Focused Edge conversation flow 9/9 PASS, exit 0, mock/live false. Preservation/relative links PASS; no protected data changes or missing baseline files. Full recording/browser suite not rerun; no UI code change. Details are in [LOCAL_LIVE_AI_VERIFICATION](LOCAL_LIVE_AI_VERIFICATION.md).

No dependencies, catalogue data, institutional rules, model choices, budget limits, API key or `.env.local` were changed. No new live test was executed. Earlier live FAIL evidence remains historical evidence, not a claimed model-quality PASS.
