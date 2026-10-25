# Synthetic browser AI verification

Date: 2026-10-15. Decision: D-036. **Scoped live browser PASS.** Viktor requested the next proposed browser check. This authorized one synthetic API attempt up to USD 0.01, followed by local confirmation/correction checks, without retries or persistent live activation.

## Observed results

An automated headless Microsoft Edge browser exercised the production build on a temporary loopback server. This was software verification, not an observed human usability study.

Synthetic input: `I want to study computer science. My annual tuition budget is 9000 EUR.`

| Step                | Expected and observed result                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Entry               | English OpenAI notice visible; invitation, adult declaration and fictional-data notice accepted; HttpOnly session cookie |
| Live interpretation | Exactly four proposals: computer science, 9000, EUR, year; all `extracted_unconfirmed`; no issue or diagnostic           |
| Confirmation        | All four exact values become `confirmed` only after the confirmation button                                              |
| Incomplete profile  | Programme search remains disabled because other required information is missing                                          |
| Manual correction   | Budget changed from 9000 to 8000 through the existing form; status becomes `user_stated` and requires review             |
| Second confirmation | Budget becomes confirmed at 8000                                                                                         |
| Reload              | Same session resumes with confirmed 8000; value visible in the browser                                                   |
| Clear               | End-and-clear removes access; a subsequent resume returns HTTP 401                                                       |
| Isolation           | No external browser requests or browser page errors; real key absent from page HTML                                      |
| Accounting          | Exactly one additional durable API attempt; no further model request for confirmation, correction, reload or clear       |
| Cleanup             | Temporary browser and server stopped; runner session deleted and invitation revoked; durable accounting retained         |

Both proposal and corrected screenshots were visually inspected. The UI shows the synthetic context, annual period and confirmed 8000; the missing fields and disabled search remain visible.

## Offline rehearsal and live evidence

The default `npm run ai:browser -- --offline` uses a separate SQLite ledger, a fake credential and a narrowly scoped fake transport preload. The child process blocks external HTTP. Its one simulated reservation / 141 micros is **not** a real API call or charge. Rehearsal PASS: `.cache/browser-ai/b99e62c8-33d2-4fae-8481-b59625ff095f/result.json`.

After rehearsal and software checks passed, `npm run ai:browser -- --approve-one-call` ran once and exited 0. This command requires explicit permission for each paid run; the flag is an operator opt-in, not permission to spend repeatedly.

- Live evidence: `.cache/browser-ai/0d07f9bd-d6b3-4f25-9dc7-892ea5e5700d/result.json`.
- Screenshots in the same directory: `synthetic-proposals.png`, `synthetic-corrected.png`. They contain only the fixed fictional test data and no invitation/key.
- Requested and validated model: `gpt-6-luna`; provider request ID: `req_ae7928511522453e8e9c5edf70a3a7bf`.
- Usage: 2,203 input tokens, including 2,200 cached, and 106 output tokens.
- Snapshot usage estimate USD 0.0000753; rounded ledger increment **76 micros / USD 0.000076**. This is not a verified invoice.
- Real ledger before: 3 attempts / 2,100 micros; after: **4 attempts / 2,176 micros / USD 0.002176 accounted**. The cumulative amount mixes the first unknown-usage reservation with later estimates.

Reports retain only fixed check codes, safe metering/diagnostics and artifact paths. No raw model payload, cookie token, invitation or key is recorded. Screenshots are ignored local artifacts, not published assets.

## Implementation and regression

`scripts/browser-ai-smoke.mjs` creates and cleans up its own server/access. Live flags are passed only to the child process. `.env.local` remains unchanged in default mock mode. `scripts/test-fixtures/browser-ai-offline.mjs` is used only in the offline child and is never imported into the application or live child.

The new optional server setting `PROTOTYPE_AI_ATTEMPT_CEILING` can only lower the fixed 20-attempt maximum. The runner sets it to the current durable count plus one. The existing atomic SQLite reservation enforces it before transport. Zero closes paid access; malformed, negative, fractional, noncanonical or above-20 values fail closed. It does not reset the ledger, enlarge any money limit or affect mock reservations. A restart using the same ceiling still blocks a second paid attempt. Existing global 20 / USD 0.25 / USD 0.01 limits remain.

Verification: 10 added regression cases; **498/498 tests in 17 files**. Golden set **50 cases / 78 executions PASS**. Lint, typecheck, production build, formatting, server-only AI negative boundary and client artifact scan PASS; scan found 16 client files / 17 trace inventories and no unsafe hits. Both offline and live Edge walkthroughs PASS. Existing source preservation and documentation link checks PASS. No Git diff is available in this checkout. Full recording/browser suite was not rerun; original demo assets were preserved.

## Limits and next scope

This proves one particular synthetic input and its confirmation/correction cycle in the browser. It does not establish broad extraction accuracy, conflict resolution with a second model message, real catalogue quality, human usability, production readiness or a real-data pilot. Programme retrieval/explanation was not triggered. See [aggregate live history](LOCAL_LIVE_AI_VERIFICATION.md) and open gates (private development record).

The one-call permission is consumed. The test left no live server running. Further paid messages or ongoing interactive use need a defined approved scope; real university publication still requires human source review. No cloud service or database migration was needed for this test.
