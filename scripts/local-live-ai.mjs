import { loadEnvFile } from "node:process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// Running ai:status cannot send HTTP. ai:live is an explicit one-call opt-in.
const args = process.argv.slice(2);
if (args.some((a) => a !== "--approve-one-call") || args.length > 1)
  throw new Error(
    "Use ai:status or ai:live (one explicitly approved synthetic API attempt).",
  );
if (existsSync(resolve(".env.local"))) loadEnvFile(resolve(".env.local"));
const approved = args.includes("--approve-one-call");
// These process-only overrides never edit .env.local or activate a running server.
process.env.APP_MODE = "mock";
process.env.AI_PROVIDER = approved ? "openai" : "mock";
process.env.AI_LIVE_APPROVED = approved ? "true" : "false";
process.env.AI_MODEL = "gpt-6-luna";
process.env.AI_DOCUMENT_ANALYSIS = "false";
process.env.PROTOTYPE_TRANSPORT = "local_http";
const { controlLedger, conversationService, handleRedeem, handleFlow } =
  await import("../src/server/conversation/http.ts");
const { currentPricing } = await import("../src/server/ai/pricing.ts");
const asOf = new Date().toISOString().slice(0, 10);
const pricing = currentPricing("gpt-6-luna", asOf);
const keyPresent =
  Boolean(process.env.OPENAI_API_KEY?.trim()) &&
  process.env.OPENAI_API_KEY !== "PASTE_YOUR_OPENAI_API_KEY_HERE";
let invite;
let token;
try {
  const status = {
    mode: approved ? "one-approved-synthetic-attempt" : "offline-status",
    keyPresent,
    pricingFresh: pricing !== null,
    ...controlLedger.evaluationStatus(),
  };
  console.log(JSON.stringify(status));
  if (approved) {
    if (!keyPresent || !pricing)
      throw new Error(
        "Local key or fresh pricing is missing. No request sent.",
      );
    invite = controlLedger.createInvite(1);
    const req = (body, sessionToken) =>
      new Request("http://127.0.0.1:3200/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:3200",
          ...(sessionToken
            ? { Cookie: `study_demo_session=${sessionToken}` }
            : {}),
        },
        body: JSON.stringify(body),
      });
    const redeemed = await handleRedeem(
      req({
        code: invite.code,
        adult: true,
        privacyNoticeAccepted: true,
        noticeVersion: "synthetic-openai-1",
        scenario: "bachelor",
      }),
    );
    if (!redeemed.ok)
      throw new Error(
        "Synthetic invitation could not be redeemed. No request sent.",
      );
    token = /study_demo_session=([^;]+)/.exec(
      redeemed.headers.get("set-cookie") ?? "",
    )?.[1];
    if (!token)
      throw new Error("Synthetic session is unavailable. No request sent.");
    const session = (await redeemed.json()).session;
    const before = controlLedger.evaluationStatus();
    const started = Date.now();
    const response = await handleFlow(
      req(
        {
          action: "message",
          revision: session.revision,
          message:
            "I want to study computer science. My annual tuition budget is 9000 EUR.",
        },
        token,
      ),
      "chat",
    );
    const result = await response.json();
    const after = controlLedger.evaluationStatus();
    const view = result.session;
    const metering = controlLedger.latestAiLog(token);
    const report = {
      checkedAt: new Date().toISOString(),
      model: "gpt-6-luna",
      returnedModel: metering?.returnedModel ?? null,
      providerRequestIds: metering?.providerRequestIds ?? [],
      usage: metering?.usage ?? null,
      usageKnown: metering?.usageKnown ?? false,
      diagnostics: metering?.diagnostics ?? [],
      pricingVersion: metering?.pricingVersion ?? null,
      syntheticOnly: true,
      httpStatus: response.status,
      issue: view?.issue?.code ?? result.error?.code ?? null,
      durationMs: Date.now() - started,
      attempts: after.attempts - before.attempts,
      accountedCostMicros: after.spentMicros - before.spentMicros,
      unconfirmedFields:
        view?.fields
          .filter((f) => f.status === "extracted_unconfirmed")
          .map((f) => f.key) ?? [],
      evaluation: after,
    };
    const directory = resolve(".cache/live-api");
    mkdirSync(directory, { recursive: true });
    const file = resolve(directory, `one-call-${randomUUID()}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2) + "\n", {
      mode: 0o600,
    });
    console.log(JSON.stringify({ ...report, file }));
    if (report.attempts !== 1 || report.issue || !response.ok)
      process.exitCode = 1;
  }
} catch {
  console.error(
    "Local AI check did not complete. Review key presence, pricing freshness, quotas and configuration; no secret or provider payload is printed. An attempted request may have a conservative reserved cost. Do not retry automatically.",
  );
  process.exitCode = 1;
} finally {
  if (token) {
    conversationService.delete(token);
    controlLedger.delete(token);
  }
  if (invite) controlLedger.revokeInvite(invite.id);
  controlLedger.close();
}
