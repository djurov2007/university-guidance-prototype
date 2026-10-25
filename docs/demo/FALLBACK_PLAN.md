# Demo fallback and local recovery

2026-10-11. Primary mode is a local production **mock**. [Offline viewer](assets/index.html), [recorded backup](assets/demo-backup.webm), [profiles](DEMO_PROFILES.md), [startup/release](RELEASE_CHECKLIST.md).

## Three usable levels

1. **Live local mock:** profile/rules/confirmation/sources/invitations/quotas execute on this computer. Explanations are simulated. The failure scenario stops visibly; Browse without explanation explicitly applies the same rules.
2. **Recorded backup:** demo-backup.webm shows a real automated browser rehearsal of seven fictional profiles, without narration or real users/API calls. Clearly say recorded rehearsal; it doesn't accept input or prove the current server is running.
3. **Offline still viewer:** open assets/index.html locally with the server stopped. It uses only local images/video, no CDN/API. Twelve full-page stills preserve questions, sources, unknown subjects/funding, no-match, permission, conflict and recovery. Click to read an image. These are recorded states, not an interactive adviser. Stills remain available if video cannot play.

| Failure                           | Action                                                    | Boundary                                                |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Unavailable explanation           | Explicit Browse without explanation or show D12-07 backup | No silent confident AI replacement                      |
| Expired/revoked session           | Fresh valid bounded invite, repeat supplied example       | RAM profile isn't restored; quota history retained      |
| Rate/quota exhausted              | Stop, wait for applicable interval or show backup         | Never delete/rename ledger or edit caps/time            |
| Build/server unavailable          | Offline video/stills; diagnose later                      | Disclose live unavailability                            |
| Suspected leak/fabrication/bypass | Stop live mode, end/revoke and isolate                    | Don't display private evidence or assert passed release |
| Network unavailable               | Production mock and backup run offline                    | First dependency/recorder preparation may need network  |

## Shutdown and rollback

Ctrl+C stops only the operator's foreground Next process. Revoke the invitation ID through the CLI; don't delete control.sqlite for rollback because it holds budget/use history. RAM profiles disappear on restart. Runtime storage is excluded from the presentation package.

Cloud deploy/remote rollback were not executed. Local rollback means stop this candidate, restore a previously retained verified **code/build** copy if available, and repeat smoke tests with the approved ledger. There is no Git/verified prior release archive here, so no automatic git rollback is claimed. If a known-good build is unavailable, the prepared offline evidence is the actual fallback. Do not bundle databases/invitations/secrets into an archive.

## Regenerate recorded evidence

Production build first. Set `PLAYWRIGHT_CHANNEL=msedge`, `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright`. Prefer normal `npx playwright install ffmpeg`, then `npm run test:e2e -- tests/e2e/demo-rehearsal.spec.ts`. The test creates an isolated test ledger/invitation and writes the named evidence; it doesn't use the operator code.

On this computer the official CDN timed out. Standalone compatible `@ffmpeg-installer/win32-x64@4.1.0` was fetched through npm into ignored .cache/demo-tooling, archive checksum verified, and copied to the local recorder cache for controlled UI frames. It is **not the official Playwright FFmpeg build or an application dependency**; lockfile unchanged. Do not feed this old recorder arbitrary untrusted media. A new machine needs a supported recorder to regenerate video; showing the existing assets needs no recorder. Provenance/checks are in RELEASE_CHECKLIST.
