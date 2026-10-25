import { loadEnvFile } from "node:process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import { ControlLedger, ledgerPath } from "../src/server/security/control.ts";
import { currentPricing } from "../src/server/ai/pricing.ts";
import {
  sessionViewSchema,
  programDetailsSchema,
} from "../src/features/conversation/schema.ts";
import { fullFlowMessages } from "../src/test-fixtures/full-conversation.ts";
import { undergraduateAnswers } from "../src/test-fixtures/profile-conversations.ts";

const args = process.argv.slice(2);
if (
  args.length > 1 ||
  args.some(
    (a) =>
      ![
        "--offline",
        "--approve-five-calls",
        "--offline-three",
        "--continue-remaining-three",
        "--offline-two",
        "--continue-remaining-two",
      ].includes(a),
  )
)
  throw new Error("Use ai:full-flow [--offline | --approve-five-calls].");
const lastTwo =
  args.includes("--offline-two") || args.includes("--continue-remaining-two");
const continuation =
  lastTwo ||
  args.includes("--continue-remaining-three") ||
  args.includes("--offline-three");
const live =
  args.includes("--approve-five-calls") ||
  args.includes("--continue-remaining-two") ||
  args.includes("--continue-remaining-three");
const callLimit = lastTwo ? 2 : continuation ? 3 : 5;
if (existsSync(resolve(".env.local"))) loadEnvFile(resolve(".env.local"));
const directory = resolve(".cache/full-flow-ai", randomUUID());
mkdirSync(directory, { recursive: true });
const path = live ? ledgerPath() : resolve(directory, "control.sqlite");
const ledger = new ControlLedger(path),
  before = ledger.evaluationStatus();
const checks = [],
  screenshots = [],
  calls = [];
let failure = null,
  phase = "startup",
  invite,
  token,
  browser,
  server,
  page,
  view;
class CheckFailure extends Error {}
function check(ok, code) {
  if (!ok) throw new CheckFailure(code);
  checks.push(code);
}
const field = (key) => view.fields.find((f) => f.key === key);
async function freePort() {
  const s = createServer();
  await new Promise((r, j) => {
    s.once("error", j);
    s.listen(0, "127.0.0.1", r);
  });
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
async function decode(response) {
  check(response.ok(), "LOCAL_HTTP_OK");
  view = sessionViewSchema.parse((await response.json()).session);
  return view;
}
function matches(response, endpoint, action) {
  if (!response.url().endsWith(`/api/${endpoint}`)) return false;
  try {
    return response.request().postDataJSON()?.action === action;
  } catch {
    return false;
  }
}
async function act(endpoint, action, locator) {
  const [response] = await Promise.all([
    page.waitForResponse((r) => matches(r, endpoint, action)),
    locator.click(),
  ]);
  return decode(response);
}
const button = (name) => page.getByRole("button", { name, exact: true });
async function confirm() {
  await act("profile", "confirm", button("Confirm these details"));
}
async function message(text, label) {
  phase = label;
  await page
    .getByRole("textbox", { name: "Ask about your study choices", exact: true })
    .fill(text);
  await act("chat", "message", button("Send message"));
  const entry = ledger.latestAiLog(token);
  check(entry !== null, `${label}_METERING_PRESENT`);
  calls.push({
    step: label,
    returnedModel: entry.returnedModel,
    usage: entry.usage,
    estimatedCostMicros: entry.estimatedCostMicros,
    providerRequestIds: entry.providerRequestIds,
    diagnostics: entry.diagnostics,
    errorCode: entry.errorCode,
  });
  check(
    entry.errorCode === null && entry.returnedModel === "gpt-6-luna",
    `${label}_PROVIDER_VALID`,
  );
}
async function shot(name) {
  const path = resolve(directory, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  screenshots.push(path);
}
async function answer(key, label, override) {
  phase = `FORM_${key}_OPEN`;
  const value = override ?? undergraduateAnswers[key];
  await button(
    `${field(key).status === "missing" ? "Answer" : "Edit"} ${label}`,
  ).click();
  const form = page.getByRole("form", { name: `Answer ${label}`, exact: true });
  phase = `FORM_${key}_FILL`;
  if (key === "previousQualification") {
    await form.locator('[name="kind"]').selectOption(value.kind);
    await form
      .getByLabel("Qualification subject", { exact: true })
      .fill(value.field);
    await form
      .getByLabel("Qualification country", { exact: true })
      .fill(value.country);
    await form.locator('[name="completion"]').selectOption(value.completion);
    await form
      .getByLabel("Completion year (optional)", { exact: true })
      .fill(String(value.completionYear));
  } else if (key === "hardConstraints") {
    await form.locator('[name="countries"]').selectOption(value.countries);
    await form.locator('[name="languages"]').selectOption(value.languages);
    await form.locator('[name="budget"]').selectOption(value.budget);
  } else {
    const input = form.locator('[name="value"]');
    if (
      [
        "studyLevel",
        "budgetIncludesLiving",
        "scholarshipNeed",
        "budgetCurrency",
        "budgetPeriod",
      ].includes(key)
    )
      await input.selectOption(
        typeof value === "boolean" ? (value ? "yes" : "no") : value,
      );
    else
      await input.fill(Array.isArray(value) ? value.join(", ") : String(value));
  }
  phase = `FORM_${key}_SAVE`;
  await act(
    "profile",
    "answer",
    form.getByRole("button", { name: "Save answer", exact: true }),
  );
}
try {
  check(existsSync(resolve(".next/BUILD_ID")), "BUILD_PRESENT");
  check(
    before.attempts + callLimit <= before.maxAttempts,
    "PLANNED_ATTEMPTS_AVAILABLE",
  );
  if (live && continuation) {
    const prior = JSON.parse(
      readFileSync(
        resolve(
          ".cache/full-flow-ai/5107d53b-1c22-4740-8c70-11681f2f54f1/result.json",
        ),
        "utf8",
      ),
    );
    const latest = lastTwo
      ? JSON.parse(
          readFileSync(
            resolve(
              ".cache/full-flow-ai/8cfa4275-c2f5-45aa-94bc-c3f2929f9ca2/result.json",
            ),
            "utf8",
          ),
        )
      : prior;
    check(
      prior.mode === "live-five-call-full-flow" &&
        prior.attempts === 2 &&
        prior.failure === "EXPLANATION_PROVIDER_VALID" &&
        prior.calls[1]?.diagnostics?.[0]?.reason ===
          "CACHE_WRITES_UNSUPPORTED" &&
        (!lastTwo ||
          (latest.attempts === 1 &&
            latest.calls[0]?.diagnostics?.[0]?.rule ===
              "SELECTIONS_FOR_WRONG_TYPE" &&
            latest.evaluationBefore.attempts ===
              prior.evaluationAfter.attempts)) &&
        before.attempts === latest.evaluationAfter.attempts &&
        before.spentMicros === latest.evaluationAfter.spentMicros &&
        before.attempts + callLimit === prior.evaluationBefore.attempts + 5,
      "CONTINUATION_WITHIN_ORIGINAL_FIVE_CALL_AUTHORIZATION",
    );
  }
  check(
    currentPricing("gpt-6-luna", new Date().toISOString().slice(0, 10)) !==
      null,
    "PRICING_FRESH",
  );
  check(
    !live || Boolean(process.env.OPENAI_API_KEY?.trim()),
    "SERVER_KEY_PRESENT",
  );
  const credential = live
    ? process.env.OPENAI_API_KEY
    : "FAKE_SERVER_CREDENTIAL_SENTINEL";
  invite = ledger.createInvite(1);
  const baseURL = `http://127.0.0.1:${await freePort()}`;
  server = spawn(
    process.execPath,
    [
      ...(!live
        ? [
            "--import",
            pathToFileURL(
              resolve("scripts/test-fixtures/full-flow-offline.mjs"),
            ).href,
          ]
        : []),
      resolve("node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      new URL(baseURL).port,
    ],
    {
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
        PROTOTYPE_AI_ATTEMPT_CEILING: String(before.attempts + callLimit),
        OPENAI_API_KEY: credential,
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );
  // Arbitrary server output and raw provider responses are never retained or echoed.
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
      /* local startup */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  check(ready, "SERVER_READY");
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
    viewport: { width: 1280, height: 1000 },
  });
  let external = 0,
    errors = 0;
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== baseURL) {
      external++;
      await route.abort();
    } else await route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", () => {
    errors++;
  });
  await page.goto("/");
  check(
    (await page.locator(".flow-notice").innerText()).includes(
      "sends your fictional messages",
    ),
    "LIVE_NOTICE_VISIBLE",
  );
  await page.getByLabel("Invitation code").fill(invite.code);
  await page.getByLabel("I am 18 or older.").check();
  await page
    .getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    )
    .check();
  await button("Start demonstration").click();
  await button("Review example details").waitFor();
  const cookie = (await context.cookies()).find(
    (c) => c.name === "study_demo_session",
  );
  check(cookie?.httpOnly === true, "HTTP_ONLY_COOKIE");
  token = cookie.value;
  if (continuation) {
    await decode(
      await page.request.post("/api/chat", { data: { action: "resume" } }),
    );
    for (const [key, label, value] of [
      ["fieldOfStudy", "Study field", "computer science"],
      ["budgetAmount", "Budget amount", 9000],
      ["budgetCurrency", "Budget currency", "EUR"],
      ["budgetPeriod", "Budget period", "year"],
    ])
      await answer(key, label, value);
    check(!view.ready, "CONTINUATION_INITIAL_FIELDS_ENTERED_MANUALLY");
  } else {
    await message(fullFlowMessages.initial, "INITIAL");
    check(
      view.issue === null &&
        view.fields.filter((f) => f.proposals.length).length === 4,
      "INITIAL_FOUR_PROPOSALS",
    );
    for (const [key, value] of Object.entries({
      fieldOfStudy: "computer science",
      budgetAmount: 9000,
      budgetCurrency: "EUR",
      budgetPeriod: "year",
    }))
      check(
        JSON.stringify(field(key)?.proposals[0]?.value) ===
          JSON.stringify(value) &&
          field(key)?.status === "extracted_unconfirmed",
        `INITIAL_${key.toUpperCase()}_EXACT`,
      );
    check(
      !view.ready && view.questions.length > 0,
      "MISSING_QUESTIONS_PRESENT",
    );
  }
  await confirm();
  phase = "forms";
  for (const [key, label] of Object.entries({
    studyLevel: "Study level",
    studyGoal: "Study goal",
    preferredCountries: "Preferred countries",
    teachingLanguages: "Teaching languages",
    budgetIncludesLiving: "Include living costs",
    scholarshipNeed: "Scholarship need",
    startYear: "Start year",
    previousQualification: "Previous qualification",
    hardConstraints: "Firm requirements",
  }))
    await answer(key, label);
  check(!view.ready, "FORM_ANSWERS_REQUIRE_CONFIRMATION");
  await confirm();
  check(view.ready, "FULL_PROFILE_CONFIRMED");
  await act("recommendations", "search", button("Browse without explanation"));
  const expected = structuredClone(view.matching);
  check(
    JSON.stringify(expected?.options.map((o) => o.programId)) ===
      JSON.stringify(["synthetic-computing", "synthetic-software"]),
    "DETERMINISTIC_TWO_OPTIONS",
  );
  phase = "EXPLANATION";
  await act("recommendations", "search", button("Find programmes"));
  const entry = ledger.latestAiLog(token);
  calls.push({
    step: phase,
    returnedModel: entry?.returnedModel,
    usage: entry?.usage,
    estimatedCostMicros: entry?.estimatedCostMicros,
    providerRequestIds: entry?.providerRequestIds,
    diagnostics: entry?.diagnostics,
    errorCode: entry?.errorCode,
  });
  check(
    entry?.returnedModel === "gpt-6-luna" && entry?.errorCode === null,
    "EXPLANATION_PROVIDER_VALID",
  );
  check(
    JSON.stringify(view.matching) === JSON.stringify(expected),
    "EXPLANATION_PRESERVES_IDS_ORDER_REASONS_SOURCES_WARNINGS",
  );
  check(
    view.issue?.code === "SOURCE_UNVERIFIED",
    "UNKNOWN_CONDITIONS_REMAIN_VISIBLE",
  );
  await expect(page.locator(".flow-programme")).toHaveCount(2);
  await button("View sources for Synthetic computing bachelor").click();
  const region = page.getByRole("region", {
    name: "Sources for Synthetic computing bachelor",
  });
  await expect(region).toContainText("not an official university source");
  const detail = await page.request.get("/api/programs/synthetic-computing");
  check(detail.ok(), "SOURCE_DETAILS_AVAILABLE");
  const detailBody = await detail.json();
  const sources = programDetailsSchema.parse(detailBody.program ?? detailBody);
  check(
    sources.sources.every((s) => s.url === null),
    "NO_INVENTED_REAL_SOURCE_URL",
  );
  await shot("recommendations-with-sources");
  await message(fullFlowMessages.budget, "LOWER_BUDGET");
  check(
    view.matching === null &&
      !view.ready &&
      field("budgetAmount").value === 9000 &&
      field("budgetAmount").proposals.some((p) => p.value === 7000),
    "LOWER_BUDGET_PENDING_PRIOR_VALUE_PRESERVED",
  );
  const card = button("Edit Budget amount").locator("..");
  await expect(card.locator(".flow-status")).toHaveText("Needs confirmation");
  await expect(card).toContainText("Current confirmed answer: 9000");
  await expect(button("Find programmes")).toBeDisabled();
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await shot("pending-budget-change");
  await confirm();
  check(
    field("budgetAmount").value === 7000,
    "LOWER_BUDGET_EXPLICITLY_CONFIRMED",
  );
  await act("recommendations", "search", button("Browse without explanation"));
  check(
    view.matching.options.length === 0 &&
      view.matching.permissionRequests.length > 0,
    "OVER_BUDGET_OPTIONS_REQUIRE_PERMISSION",
  );
  check(
    (await page.request.get("/api/programs/synthetic-computing")).status() ===
      404,
    "SOURCES_HIDDEN_BEFORE_PERMISSION",
  );
  await act(
    "recommendations",
    "consent",
    page
      .getByRole("button", { name: "Allow this alternative", exact: true })
      .first(),
  );
  check(
    view.matching.options.length > 0 &&
      view.matching.options.every((o) => o.kind === "conditional_alternative"),
    "GRANTED_OPTIONS_STAY_CONDITIONAL",
  );
  await act(
    "recommendations",
    "consent",
    page
      .getByRole("button", {
        name: "Withdraw alternative permission",
        exact: true,
      })
      .first(),
  );
  check(view.matching.options.length === 0, "REVOCATION_HIDES_OPTIONS");
  if (lastTwo) {
    await answer("preferredCountries", "Preferred countries", ["FR"]);
    check(
      !view.ready && view.matching === null,
      "COUNTRY_CHANGED_MANUALLY_REQUIRES_CONFIRMATION",
    );
  } else {
    await message(fullFlowMessages.country, "COUNTRY_CHANGE");
    check(
      !view.ready &&
        view.matching === null &&
        JSON.stringify(field("preferredCountries").value) === '["DE","NL"]' &&
        JSON.stringify(field("preferredCountries").proposals[0]?.value) ===
          '["FR"]',
      "COUNTRY_CHANGE_REQUIRES_CONFIRMATION",
    );
  }
  await confirm();
  await act("recommendations", "search", button("Browse without explanation"));
  check(
    view.matching.options.length === 0 &&
      JSON.stringify(field("preferredCountries").value) === '["FR"]',
    "FORMER_COUNTRIES_NOT_SILENTLY_RECOMMENDED",
  );
  if (!continuation) {
    const fieldsBefore = JSON.stringify(view.fields),
      revisionBefore = view.profileRevision;
    await message(fullFlowMessages.ambiguous, "AMBIGUOUS_BUDGET");
    check(
      view.issue === null &&
        JSON.stringify(view.fields) === fieldsBefore &&
        view.profileRevision === revisionBefore,
      "AMBIGUITY_DOES_NOT_INVENT_OR_ERASE_VALUES",
    );
  } else checks.push("AMBIGUITY_VERIFIED_OFFLINE_ONLY");
  phase = "reload_cleanup";
  await page.reload();
  await button("Edit Budget amount").waitFor();
  await decode(
    await page.request.post("/api/chat", { data: { action: "resume" } }),
  );
  check(
    field("budgetAmount").value === 7000 &&
      JSON.stringify(field("preferredCountries").value) === '["FR"]',
    "RELOAD_PRESERVES_CONFIRMED_CHANGES",
  );
  check(!(await page.content()).includes(credential), "NO_CREDENTIAL_IN_PAGE");
  check(
    external === 0 && errors === 0,
    "NO_EXTERNAL_BROWSER_REQUEST_OR_PAGE_ERROR",
  );
  await shot("changed-profile");
  await button("End and clear session").click();
  await button("Start demonstration").waitFor();
  check(
    (
      await page.request.post("/api/chat", { data: { action: "resume" } })
    ).status() === 401,
    "CLEAR_PREVENTS_RESUME",
  );
  const after = ledger.evaluationStatus();
  check(
    after.attempts - before.attempts === callLimit &&
      calls.length === callLimit,
    "EXACT_PLANNED_CALL_COUNT",
  );
  check(
    after.spentMicros - before.spentMicros <= callLimit * 10000,
    "WITHIN_FIVE_CENT_CAP",
  );
} catch (error) {
  failure =
    error instanceof CheckFailure
      ? error.message
      : `UNEXPECTED_FAILURE_${phase}`;
  if (token && page) {
    try {
      await shot("synthetic-failure-state");
    } catch {
      /* safe phase code retained */
    }
  }
} finally {
  try {
    if (browser) await browser.close();
  } catch {
    failure ??= "BROWSER_CLEANUP_FAILED";
  }
  if (server && server.exitCode === null) {
    const stopped = new Promise((r) => {
      const timer = setTimeout(() => r(false), 4000);
      timer.unref();
      server.once("exit", () => {
        clearTimeout(timer);
        r(true);
      });
    });
    server.kill();
    if (!(await stopped)) failure ??= "SERVER_CLEANUP_FAILED";
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
    mode: live
      ? continuation
        ? lastTwo
          ? "live-reviewed-two-call-continuation"
          : "live-reviewed-three-call-continuation"
        : "live-five-call-full-flow"
      : continuation
        ? lastTwo
          ? "offline-fake-two-call-continuation"
          : "offline-fake-three-call-continuation"
        : "offline-fake-full-flow",
    syntheticOnly: true,
    pass: failure === null,
    failure,
    phase,
    checks,
    calls,
    screenshots,
    attempts: after.attempts - before.attempts,
    accountedCostMicros: after.spentMicros - before.spentMicros,
    evaluationBefore: before,
    evaluationAfter: after,
  };
  const file = resolve(directory, "result.json");
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  ledger.close();
  console.log(JSON.stringify({ ...report, file }));
  if (!report.pass) process.exitCode = 1;
}
