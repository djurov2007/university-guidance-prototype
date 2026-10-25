# Security review — 25 October 2026

This is a scoped source and dependency review, not a security certification or a guarantee of zero vulnerabilities. No exploit, load test, paid AI request, credential transfer or account-permission change was performed.

## Findings and fixes

| Finding                                                                     | Severity / context                                                                                                                                                             | Remediation                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.3.8 appears in three advisories, including critical RCE findings | Critical dependency finding; no use of next/image, use-cache or Server Actions was found in application source. Absence of those usages does not establish framework immunity. | Next.js and eslint-config-next upgraded to 16.4.3.                                                                                                        |
| Zod 4.6.5 oversized constrained collection validation                       | High dependency finding. HTTP bodies are already bounded to 40 KB.                                                                                                             | Upgraded to 4.6.7.                                                                                                                                        |
| Vite 8.3.2 editor/path handling advisories                                  | High development dependency finding; Vite is not the production application server.                                                                                            | Upgraded to 8.3.5.                                                                                                                                        |
| Session authentication and quota checks ran after body parsing              | Availability hardening: unauthorised clients could consume body parsing resources.                                                                                             | Authentication and session rate limiting now run before reading a body. Regression verifies bodyUsed remains false for rejected unauthenticated requests. |
| JSON Content-Type accepted arbitrary suffixes                               | Input validation weakness; not a demonstrated authentication bypass.                                                                                                           | Exact case-insensitive application/json media type, optional parameters accepted. Misleading media type regression added.                                 |

Advisories: [Next.js](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Next.js Server Actions](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [Next.js use-cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr), [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [Vite Windows editor](https://github.com/advisories/GHSA-587h-7wmj-h5pm).

## Reviewed controls

- Invitations and session tokens use 32 random bytes; only SHA-256 token/code hashes are stored in SQLite. Invites expire, have bounded uses and can be revoked. Sessions expire, and cookies are HttpOnly, SameSite=Strict and Secure under HTTPS.
- Mutation routes validate the configured origin, Host/forwarded host and protocol. Cross-site fetches and missing mutation Origin are rejected. This is CSRF protection, not a defence against a client that already possesses a valid invitation/token.
- Request streaming byte limits, strict input schemas, session isolation, parameterised SQL and safe fixed error responses are present. No application eval, shell execution or dangerouslySetInnerHTML was found.
- CSP uses a nonce, strict-dynamic, no objects/frames and self-only connections. Production headers observed remotely include HSTS, DENY framing, nosniff, no-referrer, restricted Permissions-Policy and no-store.
- AI transport targets a fixed HTTPS endpoint, rejects redirects, bounds provider response bytes, disables tools, retries and response storage, validates structured and semantic output and reserves spend before transport. Unknown usage retains its reserved cost. Real documents/upload remain disabled.
- Runtime files and keys are excluded from Git and standalone traces. Existing secret-pattern scans are not proof against every possible credential format.
- Container application runs as nextjs after a root entrypoint prepares its volume. Only one process/replica is supported. Container image/OS vulnerability scanning and hosting runtime isolation were not independently verified.

## Remaining priorities

1. Keep live AI disabled until its explicit budget approval. Keep the provider key server-side and review provider usage. Application caps are not a guarantee for a stolen key used outside this application; use a dedicated provider project with limited permissions and alerts.
2. Verify GitHub/Railway MFA or passkeys, recovery codes, collaborator access, installed applications and deployment audit logs with the account owner. These account settings were not changed or certified by this review.
3. Enable secret scanning/push protection, Dependabot alerts and private vulnerability reporting where available. Protect main with required reviews/checks; public visibility can change available rules. Automated update configuration is included, but platform settings are not assumed enabled.
4. Add edge-level request/concurrency controls before a real pilot. Application quotas do not stop distributed denial of service, connection exhaustion or a flood against the global redemption throttle. Enforce upload/body-read deadlines at the proxy/hosting edge; the current body reader has a byte cap but no independent read deadline.
5. Pin/review container base image updates, scan OS packages and maintain tested encrypted backups of the persistent control ledger. Never restore an older ledger in a way that silently resets spend limits.
6. Before personal-data use, add a separately approved privacy/retention flow, access logging and an independent penetration test. RAM profiles, invite-only access and a successful test suite do not establish production readiness.

## Verification

Patched npm audit: 0 known vulnerabilities across production and development dependencies on 25 October 2026. Full offline suite, build and boundary results are recorded below after execution. Two stale tests were corrected: daily-budget fixture now uses the current cap, and published computing matching now expects an explicit permission gate with no visible alternatives.

Final local evidence: 555/555 tests PASS; lint/typecheck and production build PASS (Next 16.4.3); both negative server-import boundary checks PASS; client scan PASS (16 files, 17 tracing inventories, no hits or unsafe traces). AI boundary fixture now uses Turbopack, matching the production build, because upgraded webpack did not expose the expected diagnostic text. No live-model quality claim follows from these offline checks.

Deployment update — 25 October 2026: Viktor explicitly approved publication and live API activation within the agreed caps. Security patch commit 0920280 was deployed successfully on Railway. Remote policy confirms liveAiEnabled=true, externalAi=true, noticeVersion=synthetic-openai-1, session USD 0.10 and daily USD 0.50. Lifetime caps remain 200 attempts/USD 2 and USD 0.01 per request; the existing ledger was preserved. No paid model request was sent during deployment verification. Health mode=mock describes APP_MODE, not AI_PROVIDER; the security policy is authoritative for live-provider status.
