# Release checklist and final Phase 1 report

Post-closeout napomena 2026-10-17, D-043/D-044: demo dokazi ispod ostaju rezultati od 11. oktobra. Naknadno je published katalog 1.0.3 ljudski odobren i validiran: 8 programa, 31 official izvor, 145 činjenica i 26 visible unknown. [Aktuelni završni status](../PHASE_1_CLOSEOUT.md). Live AI, pravi pilot/dokumenti, cloud i Phase 2 ostaju neodobreni.

`phase1-demo-1`, 2026-10-11. **Local synthetic mock release only.** D-027/D-028. [Script](DEMO_SCRIPT.md), [profiles](DEMO_PROFILES.md), [fallback](FALLBACK_PLAN.md), [limits](KNOWN_LIMITATIONS.md), [previous QA](../testing/QA_REPORT.md).

## Exact local startup

This project needs Node24/npm11 and existing locked dependencies. No API key/cloud account. If node_modules is absent, npm ci needs network; prepare before the meeting. Do not change dependencies with audit --force.

```powershell
Set-Location -LiteralPath 'C:\Users\Viktor\Desktop\PROJEKAT'
$env:PATH = 'C:\Users\Viktor\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
$env:APP_MODE = 'mock'
$env:AI_PROVIDER = 'mock'
$env:AI_LIVE_APPROVED = 'false'
$env:AI_DOCUMENT_ANALYSIS = 'false'
$env:PROTOTYPE_TRANSPORT = 'local_http'
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:PROTOTYPE_CONTROL_DB = '.local/security/control.sqlite'
npm run build
npm run invitation:create -- 8
npm run start -- --port 3200
```

If npm isn't on PATH, use `node 'C:\Users\Viktor\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js' run <script>` with the same arguments. Direct server equivalent: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3200`. The server stays in the foreground. If the port is occupied, identify its owner and select a free port such as 3201; don't terminate unrelated software.

Open `http://127.0.0.1:3200/` on this computer. Health must report mock ready; that alone doesn't prove an invited flow. Read the code privately from ignored .local/security/local-review-invitation.txt. Create returns ID/expiry/file, overwrites that operator file and **doesn't revoke older codes**; save the ID privately. Invite expiry 24h, session 30min. Revoke with `npm run invitation:revoke -- <ID>`. Ctrl+C stops only this foreground server. Retain the ledger; deletion/reset isn't a quota bypass.

## Final gate

PASS = executed for candidate; FAIL = executed and failed; NOT RUN = not tested; BLOCKED = missing approval/evidence. Limitation is accepted only for stated trusted-local scope.

| Gate                                     | Evidence / result                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main flow without rescue / repeatability | PASS: 28/28 Edge browser tests, including seven-profile rehearsal, final runner exit 0                                                                 |
| No known critical leak in defined set    | PASS candidate security/isolation/limits regression; no known open enabled-flow blocker in the defined set                                             |
| Browser key/trace separation             | Candidate scan PASS 16 static files/17 traces, zero key/unsafe-storage hits                                                                            |
| Hard limits / subjects / permission      | Golden PASS 50/50 / 78 executions; new missing/none/complete subjects tests PASS                                                                       |
| Sources/date/unknown/next step           | Post-closeout validator PASS: published 1.0.3, 8 programmes/31 official sources/145 facts/26 visible unknown; synthetic demo evidence remains labelled |
| Safe errors / bounded requests           | PASS fake provider/limits tests and explicit browser recovery; no external rehearsal requests                                                          |
| Real video / offline backup              | PASS: real 69.68-second silent WebM, 1280×720, 12 stills; 3 seek frames and local file viewer checked, no external page resources or mobile overflow   |
| Honest docs / preservation / links       | PASS final format/preservation/link checks                                                                                                             |
| Software / build / strict TS/lint        | Candidate 360 Vitest/14 files PASS; build/types/lint PASS                                                                                              |
| Format                                   | PASS final format/preservation/link checks                                                                                                             |
| Dependency audit                         | Step 11 on 2026-10-11: FAIL 5 high dev / PASS 0 prod; not fixed or a second fresh audit                                                                |
| Live / PDF / cloud / real-data pilot     | BLOCKED and disabled; deployment/remote smoke/rollback NOT RUN                                                                                         |

## Approximate session cost and controls

**External AI cost per demonstrated mock session: USD 0.** No external provider requests occur. Electricity/operator time/hardware aren't measured or claimed free. Mock usage cannot yield a measured paid-session price. A live estimate needs approved model/current prices, uncached/cached input/output usage and bounded attempts; the configured cap is not an actual bill.

Current controls: 40 messages/session, 30 actions/minute, max 30min, 300000 simulated tokens/session, 2000000/day, configured upper reserve budget USD 0.25/session and USD 10/day, bounded redemption and one active reservation/session. These don't guarantee a number of complete searches. Deleting a profile doesn't reset global usage. No paid product route or actual provider charge is enabled.

## Final report — eleven answers

1. **Implemented:** profile/questions/confirmation/conflicts, deterministic matching/permission/sources, strict simulated AI, bounded invited adult/notice controls. Seven synthetic profiles, prerequisite fixture and existing master subjects editor, ten demo docs and backup package. No large new feature.
2. **Tested:** candidate software/golden/build/client/source checks, browser demo/regression, actual recording/fallback and docs/hash checks as recorded above. Human/model/remote results are separate.
3. **Passing:** the final evidence table; tests merely existing aren't proof of PASS.
4. **Failing:** dev dependency audit five high; initial recorder prerequisite/test failures are resolved in the final successful rehearsal and remain documented below. Published 1.0.3 still contains 26 accepted unknown and manual individual bindings.
5. **Disabled:** regular paid/live AI product mode, real uploads/documents, personal-data pilot, cloud/public deployment and Phase 2 work.
6. **Risks:** development tools, limited fake/NLP scope, incomplete individual data bindings, RAM/local operation, no independent security/legal/WCAG review; KNOWN_LIMITATIONS.
7. **Cost/session:** USD 0 external AI for mock; no measured live cost; future caps aren't prices.
8. **Local demo readiness:** PASS for the local synthetic mock scope; seven-profile rehearsal and offline fallback verified. Not real admissions/pilot readiness.
9. **Invited testers:** technically prepared for supervised synthetic adult review on this computer; actual notes/participation require named operator and agreed protocol. No testers contacted/tested; real-data pilot remains blocked.
10. **Presentation:** truthful one-pager, seven-slide outline and 3–5min script/backup, with verified local video/stills. Internal prototype evidence, not validated admissions advice or partnership.
11. **Before Phase 2:** controlled catalogue publication is complete for 1.0.3. The project owner must explicitly choose scope/priorities/capacity; name processing/operator/retention owners, approve model/account/request budget and guard integration/evaluations, define hosting/TLS/security/a11y review and consent-appropriate task evidence. Track the dependency fix. Retain excluded features where gates stay closed. Local Phase 1 success doesn't automatically authorise Phase 2.

Cloud preview/remote smoke/cloud rollback **NOT RUN**: no approved account/budget/deploy. Local rehearsal plus offline fallback is the chosen alternative. No materials have been sent externally.

## Candidate verification and resolved rehearsal failures

2026-10-11: 360/360 Vitest tests in 14 files, golden 50/50 (78/78 executions), 28/28 Edge production-browser tests. Build/strict TypeScript/typegen/lint, source validator and both server-only negative builds PASS. Client scan 16 static files/17 trace inventories, zero key or runtime-storage hits. Mobile/basic accessibility and keyboard tests remain PASS. Recorder output decodes/seeks at three points, 12 images load, viewer opens via file:// with 0 external page requests and no 390px overflow. Actual recording date is stored in .cache/demo-recording/rehearsal-result.json; video/still integrity in assets/MANIFEST.json. The recording is 69.68s, not a narrated 3–5min pitch; the supplied live/presentation script has its own planned duration.

Initial recorder failed because official FFmpeg was unavailable and all CDN downloads timed out. Alternative trusted-frame recording tool: @ffmpeg-installer/win32-x64@4.1.0, archive SHA1 17e8699b5798d4c60e36e2d6326a8ebe5e95a2c5, binary SHA256 c8abc49e7be62dde8e12972af373959e0076a7b8dc8040eb45978e0608f8781e. Fetched with npm pack --ignore-scripts into ignored cache, without install/lockfile change. Only the exact regular-file binary was extracted; it is a compatibility tool, not Playwright build 1011 or a patched general media processor. No tool binary is included in the demo assets or server traces.

The rehearsal initially used Answer for an existing field (actual label Edit), then an exact nested-label selector instead of the existing combobox role; corrected test selectors and bounded per-action timeout. It also exposed two genuine UI gaps: missing master Relevant subjects was hidden, and check status had no check label. The existing subject editor is now reachable in the master demo, and the server-provided validated condition label is rendered as escaped React text. Missing/none/complete subjects are unknown/excluded/likely_met respectively, with no rule waiver or changed real catalogue. These are scope-limited stabilization fixes, not new large features. The final complete browser run passes; no failed/partial video is advertised as the release backup.

The 11 October source validator result was 8 staging/28 sources/142 facts/26 warnings and published 0. D-043 later produced validated published 1.0.3 with 8 programmes/31 official sources/145 facts/26 accepted visible unknown and eight human approvals. No real users, personal documents, cloud release or external message occurred during this demo release.

## Final preservation and scope decision

Format PASS. No Git diff is available: baseline/hash review found 206 authored files, 29 new, 9 targeted changes and 168 unchanged baseline files. Zero missing/unexpected changes; 69 Markdown documents and 553 relative links, zero broken. New code and documents were reviewed; assets have verified checksums. Master PDF SHA256 remains 727f5d96a514b27711a8885a15af9ad7211d008d71e6e8490ff76b496d211f84. Real staging/published data, package-lock, original sources and domain matching/AI contracts were preserved. Evidence: .cache/prompt12-preservation-links.json.

**Phase 1 local mock demonstration gate: PASS.** No known critical enabled-flow blocker remains in the defined tests; risky live/upload/cloud functions stay disabled. This is a completed demonstration/preparation package, not a real-data pilot, reviewed university adviser, approved legal/privacy system or independent security certificate. Invited synthetic reviewing remains conditional on a named organiser/agreed note protocol; no actual participants were engaged. Phase 2 is not started or authorised.
