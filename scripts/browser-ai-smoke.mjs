import { loadEnvFile } from "node:process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { ControlLedger, ledgerPath } from "../src/server/security/control.ts";
import { currentPricing } from "../src/server/ai/pricing.ts";
import { sessionViewSchema } from "../src/features/conversation/schema.ts";

const args = process.argv.slice(2);
if (
  args.length > 1 ||
  args.some((arg) => !["--offline", "--approve-one-call"].includes(arg))
)
  throw new Error("Use ai:browser [--offline | --approve-one-call].");
const live = args.includes("--approve-one-call");
if (existsSync(resolve(".env.local"))) loadEnvFile(resolve(".env.local"));
const runId = randomUUID();
const directory = resolve(".cache/browser-ai", runId);
mkdirSync(directory, { recursive: true });
const path = live ? ledgerPath() : resolve(directory, "control.sqlite");
const ledger = new ControlLedger(path);
const before = ledger.evaluationStatus();
const checks = [];
const screenshots = [];
let failure = null;
let invite, token, browser, server, metering;
let pageErrors = 0;
class SmokeFailure extends Error {}
function check(condition, code) {
  if (!condition) throw new SmokeFailure(code);
  checks.push(code);
}
const expected = {
  fieldOfStudy: "computer science",
  budgetAmount: 9000,
  budgetCurrency: "EUR",
  budgetPeriod: "year",
};
const labels = {
  fieldOfStudy: "Study field",
  budgetAmount: "Budget amount",
  budgetCurrency: "Budget currency",
  budgetPeriod: "Budget period",
};
const message =
  "I want to study computer science. My annual tuition budget is 9000 EUR.";
function field(view, key) {
  return view.fields.find((entry) => entry.key === key);
}
function valueEqual(key, actual, wanted) {
  return key === "fieldOfStudy"
    ? typeof actual === "string" && actual.toLowerCase().trim() === wanted
    : actual === wanted;
}
async function port() {
  const socket = createServer();
  await new Promise((done, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", done);
  });
  const number = socket.address().port;
  await new Promise((done) => socket.close(done));
  return number;
}
async function responseView(response) {
  check(response.ok(), "LOCAL_RESPONSE_OK");
  return sessionViewSchema.parse((await response.json()).session);
}
function matches(response, endpoint, action) {
  if (!response.url().endsWith(`/api/${endpoint}`)) return false;
  try {
    return response.request().postDataJSON()?.action === action;
  } catch {
    return false;
  }
}
try {
  check(existsSync(resolve(".next/BUILD_ID")), "PRODUCTION_BUILD_PRESENT");
  check(before.attempts < before.maxAttempts, "ATTEMPT_AVAILABLE");
  check(
    !live ||
      (Boolean(process.env.OPENAI_API_KEY?.trim()) &&
        process.env.OPENAI_API_KEY !== "PASTE_YOUR_OPENAI_API_KEY_HERE"),
    "SERVER_KEY_PRESENT",
  );
  check(
    currentPricing("gpt-6-luna", new Date().toISOString().slice(0, 10)) !==
      null,
    "PRICING_FRESH",
  );
  invite = ledger.createInvite(1);
  const listenPort = await port();
  const baseURL = `http://127.0.0.1:${listenPort}`;
  const childArgs = [
    ...(!live
      ? [
          "--import",
          pathToFileURL(resolve("scripts/test-fixtures/browser-ai-offline.mjs"))
            .href,
        ]
      : []),
    resolve("node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(listenPort),
  ];
  server = spawn(process.execPath, childArgs, {
    cwd: process.cwd(),
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      APP_MODE: "mock",
      AI_PROVIDER: "openai",
      AI_MODEL: "gpt-6-luna",
      AI_LIVE_APPROVED: "true",
      AI_DOCUMENT_ANALYSIS: "false",
      PROTOTYPE_TRANSPORT: "local_http",
      PROTOTYPE_CONTROL_DB: path,
      PROTOTYPE_AI_ATTEMPT_CEILING: String(before.attempts + 1),
      OPENAI_API_KEY: live
        ? process.env.OPENAI_API_KEY
        : "FAKE_SERVER_CREDENTIAL_SENTINEL",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  // Never echo arbitrary server output into the operator report or chat.
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  let spawnFailed = false;
  server.once("error", () => {
    spawnFailed = true;
  });
  let ready = false;
  for (let i = 0; i < 60 && !spawnFailed && server.exitCode === null; i++) {
    try {
      if (
        (
          await fetch(`${baseURL}/api/health`, {
            signal: AbortSignal.timeout(500),
          })
        ).ok
      ) {
        ready = true;
        break;
      }
    } catch {
      /* local startup only */
    }
    await new Promise((done) => setTimeout(done, 250));
  }
  check(ready, "LOCAL_SERVER_READY");
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
    viewport: { width: 1280, height: 900 },
  });
  let externalBrowserRequests = 0;
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== baseURL) {
      externalBrowserRequests++;
      await route.abort();
    } else await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", () => {
    pageErrors++;
  });
  await page.goto("/");
  check(
    (await page.locator(".flow-notice").innerText()).includes(
      "sends your fictional messages",
    ),
    "OPENAI_NOTICE_VISIBLE",
  );
  await page.getByLabel("Invitation code").fill(invite.code);
  await page.getByLabel("I am 18 or older.").check();
  await page
    .getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    )
    .check();
  await page
    .getByRole("button", { name: "Start demonstration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review example details", exact: true })
    .waitFor();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "study_demo_session",
  );
  check(cookie?.httpOnly === true, "SESSION_COOKIE_HTTP_ONLY");
  token = cookie.value;
  await page
    .getByRole("textbox", { name: "Ask about your study choices", exact: true })
    .fill(message);
  const [modelResponse] = await Promise.all([
    page.waitForResponse((r) => matches(r, "chat", "message")),
    page.getByRole("button", { name: "Send message", exact: true }).click(),
  ]);
  let view = await responseView(modelResponse);
  metering = ledger.latestAiLog(token);
  check(view.issue === null, "AI_INTERPRETATION_ACCEPTED");
  check(
    view.fields.filter((f) => f.status === "extracted_unconfirmed").length ===
      4,
    "FOUR_UNCONFIRMED_FIELDS",
  );
  for (const [key, value] of Object.entries(expected)) {
    check(
      field(view, key)?.status === "extracted_unconfirmed" &&
        valueEqual(key, field(view, key)?.proposals[0]?.value, value),
      `PROPOSED_${key.toUpperCase()}_CORRECT`,
    );
  }
  await page
    .getByRole("button", { name: "Confirm these details", exact: true })
    .waitFor();
  check(
    (await page.locator(".flow-status.extracted_unconfirmed").count()) === 4,
    "UNCONFIRMED_VISIBLE_IN_BROWSER",
  );
  check(
    !live || !(await page.content()).includes(process.env.OPENAI_API_KEY),
    "NO_KEY_IN_PAGE",
  );
  const proposedPath = resolve(directory, "synthetic-proposals.png");
  await page.screenshot({ path: proposedPath, fullPage: true });
  screenshots.push(proposedPath);
  const [confirmedResponse] = await Promise.all([
    page.waitForResponse((r) => matches(r, "profile", "confirm")),
    page
      .getByRole("button", { name: "Confirm these details", exact: true })
      .click(),
  ]);
  view = await responseView(confirmedResponse);
  for (const [key, value] of Object.entries(expected))
    check(
      field(view, key)?.status === "confirmed" &&
        valueEqual(key, field(view, key)?.value, value),
      `CONFIRMED_${key.toUpperCase()}_CORRECT`,
    );
  check(
    await page
      .getByRole("button", { name: "Find programmes", exact: true })
      .isDisabled(),
    "INCOMPLETE_PROFILE_CANNOT_SEARCH",
  );
  await page
    .getByRole("button", { name: `Edit ${labels.budgetAmount}`, exact: true })
    .click();
  const form = page.getByRole("form", {
    name: "Answer Budget amount",
    exact: true,
  });
  await form
    .getByRole("spinbutton", { name: "Budget amount", exact: true })
    .fill("8000");
  const [editedResponse] = await Promise.all([
    page.waitForResponse((r) => matches(r, "profile", "answer")),
    form.getByRole("button", { name: "Save answer", exact: true }).click(),
  ]);
  view = await responseView(editedResponse);
  check(
    field(view, "budgetAmount")?.value === 8000 &&
      field(view, "budgetAmount")?.status === "user_stated",
    "MANUAL_CORRECTION_REQUIRES_REVIEW",
  );
  await page
    .getByRole("button", { name: "Confirm these details", exact: true })
    .waitFor();
  const [reconfirmedResponse] = await Promise.all([
    page.waitForResponse((r) => matches(r, "profile", "confirm")),
    page
      .getByRole("button", { name: "Confirm these details", exact: true })
      .click(),
  ]);
  view = await responseView(reconfirmedResponse);
  check(
    field(view, "budgetAmount")?.value === 8000 &&
      field(view, "budgetAmount")?.status === "confirmed",
    "CORRECTION_EXPLICITLY_CONFIRMED",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Edit Budget amount", exact: true })
    .waitFor();
  const resumed = await responseView(
    await page.request.post("/api/chat", { data: { action: "resume" } }),
  );
  check(
    field(resumed, "budgetAmount")?.value === 8000 &&
      field(resumed, "budgetAmount")?.status === "confirmed",
    "RELOAD_PRESERVES_CORRECTION",
  );
  const budgetCard = page
    .getByRole("button", { name: "Edit Budget amount", exact: true })
    .locator("..");
  check(
    (await budgetCard.locator("p").first().innerText()) === "8000",
    "CORRECTION_VISIBLE_IN_BROWSER",
  );
  const correctedPath = resolve(directory, "synthetic-corrected.png");
  await page.screenshot({ path: correctedPath, fullPage: true });
  screenshots.push(correctedPath);
  await page
    .getByRole("button", { name: "End and clear session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start demonstration", exact: true })
    .waitFor();
  check(
    (
      await page.request.post("/api/chat", { data: { action: "resume" } })
    ).status() === 401,
    "CLEARED_SESSION_CANNOT_RESUME",
  );
  check(
    externalBrowserRequests === 0 && pageErrors === 0,
    "BROWSER_ISOLATION_AND_HYDRATION",
  );
  const after = ledger.evaluationStatus();
  check(after.attempts - before.attempts === 1, "EXACTLY_ONE_API_ATTEMPT");
  check(after.spentMicros - before.spentMicros <= 10000, "WITHIN_ONE_CENT_CAP");
} catch (error) {
  failure =
    error instanceof SmokeFailure
      ? error.message
      : "BROWSER_SMOKE_UNEXPECTED_FAILURE";
} finally {
  try {
    if (browser) await browser.close();
  } catch {
    failure ??= "BROWSER_CLEANUP_FAILED";
  }
  if (server && server.exitCode === null) {
    const stopped = new Promise((done) => {
      const timer = setTimeout(() => done(false), 4000);
      timer.unref();
      server.once("exit", () => {
        clearTimeout(timer);
        done(true);
      });
    });
    server.kill();
    if (!(await stopped)) failure ??= "TEST_SERVER_CLEANUP_FAILED";
  }
  try {
    if (token) ledger.delete(token);
    if (invite) ledger.revokeInvite(invite.id);
  } catch {
    failure ??= "ACCESS_CLEANUP_FAILED";
  }
  const after = ledger.evaluationStatus();
  const report = {
    checkedAt: new Date().toISOString(),
    mode: live ? "live-browser-one-call" : "offline-browser-fake-http",
    syntheticOnly: true,
    pass: failure === null,
    failure,
    checks,
    screenshots,
    attempts: after.attempts - before.attempts,
    accountedCostMicros: after.spentMicros - before.spentMicros,
    returnedModel: metering?.returnedModel ?? null,
    providerRequestIds: metering?.providerRequestIds ?? [],
    usage: metering?.usage ?? null,
    diagnostics: metering?.diagnostics ?? [],
    evaluationBefore: before,
    evaluationAfter: after,
  };
  const reportPath = resolve(directory, "result.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", {
    mode: 0o600,
  });
  ledger.close();
  console.log(JSON.stringify({ ...report, file: reportPath }));
  if (!report.pass) process.exitCode = 1;
}
