# Private AI validation diagnostics

2026-10-15, D-032. Implemented after the first live attempt was rejected. This is an offline observability change, not evidence that the original live failure was fixed. No new paid request is authorized or executed by this work.

D-034 update (2026-10-15): semantic rejection now includes fixed rule/field/proposal-index context. An offline annual/year grounding defect was reproduced and narrowly corrected; see [semantic verification](SEMANTIC_GROUNDING_VERIFICATION.md). This is not proof of the old live payload or another paid test.

## Data flow and boundary

`openai-provider.ts` attaches a strictly validated `AiDiagnostic` to normalized `ProviderError`. The education adapter forwards it to a trusted server callback and creates separate codes for selection/grounding failures. The conversation service collects at most four diagnostics and stores them in the existing private SQLite operational log. The next opt-in one-call runner copies this validated array into its sanitized local JSON report.

Diagnostics are absent from the public AI schema, session API and UI. Existing log records default to an empty diagnostic array; the previous one-call artifact remains untouched and has no recoverable detailed cause.

Only these diagnostic keys are allowed:

| Key             | Constraint                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `reason`        | One of the fixed codes below                                                                        |
| `httpStatus`    | Optional integer 100–599; identifies provider HTTP status, not the conversation handler's HTTP 200  |
| `responseBytes` | Optional count capped at 65,537 (one beyond the 65,536-byte response bound)                         |
| `invalidFields` | Optional unique top-level Zod failure categories, at most five: model, status, output, usage, other |
| `rule`          | Optional fixed semantic rule code from diagnostics.ts; valid only with SEMANTIC_SELECTION_REJECTED  |
| `field`         | Optional existing profile field enum; requires semantic rule; no field value                        |
| `proposalIndex` | Optional integer 0–7; requires field and rule                                                       |

No raw text, body preview/hash, actual unexpected model/type strings, URLs, header values, credential, applicant data, refusal text, or arbitrary Zod error messages/paths are recorded. Unexpected keys/values invalidate the diagnostic. Callback failure is isolated from validation/settlement. The usual 24-hour operational log retention still applies; a deliberately generated local operator report has separate local file lifetime and remains ignored by Git.

## Failure distinctions

| Codes                                                                      | Meaning                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `RESPONSE_TOO_LARGE`, `RESPONSE_BODY_MISSING`, `RESPONSE_NOT_JSON`         | HTTP body bound/existence/JSON parsing                                                                                               |
| `WIRE_SCHEMA_MISMATCH`                                                     | Transport envelope fails schema; fixed top-level field categories distinguish model/status/output/usage without logging their values |
| `MODEL_MISMATCH`                                                           | Returned model fails existing requested-model check                                                                                  |
| `USAGE_INCONSISTENT`                                                       | Usage relation is invalid, e.g. cached input exceeds total input                                                                     |
| `CACHE_WRITES_UNSUPPORTED`                                                 | Existing cost policy rejects nonzero cache-write usage                                                                               |
| `USAGE_EXCEEDS_RESERVATION`                                                | Input/output usage exceeds the bounded reservation/request cap                                                                       |
| `RESPONSE_STATUS_UNEXPECTED`                                               | A recognized response status is unavailable for a completed result                                                                   |
| `OUTPUT_ITEM_UNEXPECTED`, `OUTPUT_CONTENT_UNEXPECTED`, `OUTPUT_TEXT_COUNT` | Disallowed item/content or wrong number of text outputs                                                                              |
| `HTTP_REJECTED`, `NETWORK_FAILURE`, `TRANSPORT_TIMEOUT`                    | HTTP error, redacted network error, cancellation/timeout                                                                             |
| `PROVIDER_RESPONSE_SCHEMA`                                                 | Normalized provider response fails the adapter's schema                                                                              |
| `SELECTION_TEXT_BOUNDS`, `SELECTION_NOT_JSON`, `SELECTION_SCHEMA_MISMATCH` | Missing/oversize text, invalid inner JSON, wrong selection shape                                                                     |
| `SEMANTIC_SELECTION_REJECTED`                                              | IDs, sources, profile proposals, permissions or other existing grounding rules reject a structurally valid selection                 |
| `MODEL_REFUSAL`, `RESPONSE_INCOMPLETE`                                     | Separate refusal/incomplete cases; no profile update                                                                                 |

The implementation does not accept new output types, weaken source/model validation, refund unknown usage or increase limits. One concrete correction was made: inconsistent usage formerly could throw a raw Zod exception and be normalized to PROVIDER_UNAVAILABLE. It now produces INVALID_OUTPUT with USAGE_INCONSISTENT and preserves the provider request ID. This correction is proven with synthetic fixtures; it is not established as the cause of the previous live failure.

The reviewed [official Structured Outputs guidance](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses) distinguishes structured output, refusal and incomplete results. Local grounding and budget rules remain application-owned. The large Responses reference page could not be fetched in full, so no schema relaxation or unsupported compatibility claim was inferred from it.

## Verification and next live test

38 added offline checks cover bounded and missing bodies, invalid envelopes/usage, wrong model, disallowed items/content, HTTP/network/abort failures, valid boundary-sized responses, selection/grounding rejection, callback failure, diagnostic injection and private ledger/public session separation. They use fake credentials/transports and do not read or resend the old provider payload.

Full automated regression: 424/424 tests, 16 files; golden 50 cases/78 executions; typecheck/lint/build, both server-only boundaries and client trace scan PASS. Focused browser/format/preservation results are recorded in [LOCAL_LIVE_AI_VERIFICATION](LOCAL_LIVE_AI_VERIFICATION.md).

After a separately approved next single call, inspect `diagnostics` in the newly generated `.cache/live-api/one-call-*.json`, along with request IDs, usageKnown and accountedCostMicros. Empty diagnostics can also mean success or a failure outside these validation categories; it does not imply zero cost. Do not retry automatically. The previous real attempt remains FAIL with unknown detailed cause; counters remain one attempt/USD 0.001948 conservative reserve.
