# Full conversation evaluation and catalogue review

2026-10-15, D-037. **Implementation and offline flow PASS; live evaluation PARTIAL; real catalogue human review PENDING (Viktor).** This is the result of “Obavi sve to”, covering the three proposed next steps. It is not a blanket live or publication approval.

## What is usable and what was changed

The existing English UI supports a full fictional profile, explicit review, deterministic programme matching, constrained AI explanation and source details. Local forms can correct budget/country without model calls. Recommendations disappear while proposed changes need review; over-budget options require scoped permission and remain conditional. Revoke/clear/reload remain explicit.

One UI defect was corrected: an AI proposal attached to an already confirmed field could show the proposed number with a confirmed badge. It now shows “Needs confirmation” and the **current confirmed answer** separately. A pending proposal does not replace the trusted profile value. Direct contradictory user assertions use the existing conflict-resolution path; AI proposals are a separate review state, not automatically direct assertions.

The first real explanation encountered cache-write usage. The adapter now accepts optional bounded `cacheWriteTokens`, validates `cachedInputTokens + cacheWriteTokens <= inputTokens`, and prices the three disjoint input partitions. Historical logs without the optional field remain valid. A dated Luna Standard short-context snapshot adds USD 0.125/M for writes; reads/input/output remain USD 0.01/0.10/0.50 per million. Preflight reserves the worst input category, including the full byte bound as writes, plus maximum output. Old prices cannot silently price positive writes at zero; malformed/unknown usage still retains the reservation. No money/attempt limit was raised.

Official references consulted: [pricing](https://developers.openai.com/api/docs/pricing), [cache accounting formula](https://developers.openai.com/api/docs/guides/prompt-caching), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), opened 2026-10-15. The formula excludes reads/writes from ordinary input before charging each partition; writes are not an extra charge on top of the same ordinary tokens.

After two distinct semantic failures, current `education-instructions-2` gives a task-specific response contract. `response-schema.ts` also narrows the actual strict transport schema: explanation type is fixed by the server's existing matching result, questions/answer prose/proposals are excluded from explanation, interpretation question IDs are limited to the supplied IDs, and no question can be generated when that list is empty. Existing output/semantic/identity/source validators still run. The application owns the options and warnings; this does not permit free factual generation. Low-level historical callers without a turn contract retain the base schema; the application always supplies a contract. The final v2 schema restriction is **offline verified, not newly live verified** because the approved five calls were consumed.

## Five paid attempts, recorded without hiding failures

The newly authorized ceiling was five attempts / USD 0.05, with USD 0.01/request and original global caps. It was consumed as 2 + 1 + 2 across three temporary servers/sessions, with offline repairs between runs, zero automatic transport retries and no ledger reset. Manually re-entered fictional details in continuation sessions do not count as a second live extraction or one uninterrupted live conversation.

| Task attempt                               | Result                                                                                                         | Usage / accounting                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1: initial message                         | PASS: exact computer science, 9000, EUR, year proposals, unconfirmed; missing questions; explicit confirmation | 2203 input / 2200 cached / 106 output; 76 micros estimate                                                |
| 2: explanation                             | FAIL: CACHE_WRITES_UNSUPPORTED; no model selection/profile success claimed                                     | Usage not retained by the older rejecting adapter; 1849 micros reservation retained, actual bill unknown |
| 3: post-cache-fix explanation              | FAIL: SELECTIONS_FOR_WRONG_TYPE; valid model/usage, semantic validator rejected                                | 1608 input / 0 cached / 1605 writes / 146 output; 274 micros estimate                                    |
| 4: post-contract clarification explanation | PASS: exact existing two options, order, reasons, sources and warnings preserved; source panel inspected       | 1707 input / 0 cached / 1704 writes / 147 output; 287 micros estimate                                    |
| 5: lower budget message                    | FAIL: UNKNOWN_QUESTION; returned question ID was not allowed; no proposal was committed                        | 2349 input / 0 cached / 2346 writes / 88 output; 338 micros estimate                                     |

**Task accounting: 2824 micros / USD 0.002824**, a mixture of estimates and the 1849-micro unknown reservation, not confirmed billing. Durable ledger before task: 4 attempts / 2176 micros; after: **9 attempts / 5000 micros (USD 0.005000 accounted cumulatively)**. Remaining global capacity is not new user permission.

Safe reports:

- First run: `.cache/full-flow-ai/5107d53b-1c22-4740-8c70-11681f2f54f1/result.json`.
- First reviewed continuation: `.cache/full-flow-ai/8cfa4275-c2f5-45aa-94bc-c3f2929f9ca2/result.json`.
- Last two attempts: `.cache/full-flow-ai/3abf2c0d-1f06-4c11-9c46-9515cf79da3a/result.json`; successful recommendation/source screenshot is in this directory.

The semantic error codes do not reveal the raw response or exact invented ID; those were not retained. No particular malformed payload is reconstructed as a fact. Regression fixtures reproduce the rejected **classes** of output. All live servers/access were cleaned up. No persistent live mode, key/billing change, upload, cloud or real personal data was introduced.

## Offline evidence and practical limits

The fixed five-call fake-HTTP browser rehearsal covers initial extraction, complete profile forms/confirmation, exact deterministic versus explained results, source details, lower budget review/confirmation, scoped alternative grant/revoke, country proposal/confirmation, ambiguous budget, reload and session clear. The fake credential/preload is isolated from the live child; external HTTP is blocked. Simulated reservations are not paid calls. Current software tests cover invalid IDs, profile preservation, stale/pending states, empty publication and cross-session isolation as well as the above.

31 added cases, **529/529 tests in 20 files**; golden **50 cases / 78 executions PASS**. Final build/typecheck/lint, browser, server boundary/client scan, formatting, preservation and links are tracked in the execution plan (private development record). Earlier development failures included test assumptions confusing AI proposals with direct-answer conflicts, a browser form selector mismatch, and a test-only TypeScript union access; these were corrected without loosening validators.

Final current-code fake browser PASS: `.cache/full-flow-ai/e2b4fb59-04fe-4704-a644-be9b06bf91e2/result.json`; all five simulated calls contain cache-write usage. Simulated 730 micros are not a charge. Focused mock Edge regression 9/9 PASS. Client scan 16 artifacts / 17 trace inventories, no unsafe hits; negative server-only AI boundary PASS. The successful live recommendation/source screenshot and the final fake pending-budget screenshot were visually inspected: unknown warnings remain and the new 7000 suggestion is distinct from the currently confirmed 9000. No full demo recording suite was rerun or original demo assets regenerated.

Preservation/links: 221 baseline / 233 current authored files, no missing/protected changes, 252 local documentation links with zero failures. Format PASS; read-only env flag check confirmed mock/default-live-false. Evidence `.cache/full-flow-ai/preservation-links.json`. No Git diff is available in this checkout.

Live extraction and constrained recommendation explanation have passed in their stated runs. A full uninterrupted live conversation, the corrected v2 budget change, live country extraction and live ambiguity handling have **not** passed this evaluation. Manual profile correction remains available and is covered offline; do not silently present it as successful live interpretation. Another paid validation requires new permission, not rerunning a continuation flag. The continuation flags verify prior failed reports and current ledger counters and cannot be reused after the task ceiling is consumed.

## Real catalogue handoff

Viktor explicitly chose to do the human review. [Official source recheck](../data/SOURCE_RECHECK_2026-10-15.md) covers reopening all 28 source URLs and selected critical sections for the eight existing programmes. [Review packet](../data/CATALOG_REVIEW_PACKET_2026-10-15.md) contains all 142 assertion rows, evidence locators/applicant context, eight unsigned forms, every unknown ID/reason and all stale IDs. Coverage was checked programmatically: no missing assertions or sources.

Current dated catalogue validation: 8 staging programmes / 28 sources / 142 facts / 37 warnings (26 unknown + 11 stale); published 0. Original snapshots/dates/digest are preserved. Start with the two Twente 2027 records. Historical closed 2026 rounds, unbound applicant-specific costs/requirements and unknowns cannot become real recommendations through API integration. Agent research does not impersonate Viktor's signature or change effective freshness automatically. Real publication and connection to user-facing real recommendations remain pending supported data revisions, human review of the new digest and typed applicant bindings.
