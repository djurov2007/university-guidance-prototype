import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { z } from "zod";
import { tokenUsageSchema } from "../../features/ai/schema.ts";
import { ProviderError, type SpendGuard } from "../ai/provider.ts";
import { aiDiagnosticsSchema } from "../ai/diagnostics.ts";

export const securityPolicy = Object.freeze({
  noticeVersion: "synthetic-privacy-1",
  sessionMs: 1800000,
  maxMessages: 40,
  requestsPerMinute: 30,
  sessionTokens: 300000,
  dailyTokens: 2000000,
  sessionBudgetMicros: 100000,
  dailyBudgetMicros: 500000,
  logRetentionMs: 86400000,
  uploadEnabled: false,
  liveAiEnabled: false,
});
// Fixed controlled-demo protocol. No env override can increase these caps.
export const liveEvaluationPolicy = Object.freeze({
  maxAttempts: 200,
  totalBudgetMicros: 2000000,
  perRequestMicros: 10000,
  model: "gpt-6-luna",
});
function liveAttemptCeiling() {
  const value = process.env.PROTOTYPE_AI_ATTEMPT_CEILING;
  if (value === undefined) return liveEvaluationPolicy.maxAttempts;
  const ceiling = Number(value);
  if (
    !/^(?:0|[1-9]\d*)$/.test(value) ||
    !Number.isSafeInteger(ceiling) ||
    ceiling > liveEvaluationPolicy.maxAttempts
  )
    throw new ProviderError("CONFIGURATION_ERROR");
  return ceiling;
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const logSchema = z.strictObject({
  requestId: z.uuid(),
  sessionRef: z.string().regex(/^[a-f0-9]{16}$/),
  task: z.enum(["interpret_message", "explain_recommendations"]),
  model: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/),
  returnedModel: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/)
    .nullable()
    .default(null),
  durationMs: z.number().int().nonnegative(),
  tokens: z.number().int().nonnegative(),
  usageKnown: z.boolean(),
  usage: tokenUsageSchema.nullable().default(null),
  estimatedCostMicros: z.number().int().nonnegative(),
  providerRequestIds: z
    .array(z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/))
    .max(2)
    .default([]),
  pricingVersion: z.string().max(120).nullable().default(null),
  diagnostics: aiDiagnosticsSchema.default([]),
  errorCode: z
    .string()
    .regex(/^[A-Z_]{1,40}$/)
    .nullable(),
  instructionVersion: z.enum([
    "education-instructions-1",
    "education-instructions-2",
  ]),
});
type Access = {
  expires: number;
  messages: number;
  tokens: number;
  spent: number;
  active: string | null;
};
export class AccessError extends Error {
  readonly code:
    "SESSION_EXPIRED" | "INVALID_REQUEST" | "RATE_LIMITED" | "BUDGET_EXCEEDED";
  readonly status: number;
  constructor(
    code:
      | "SESSION_EXPIRED"
      | "INVALID_REQUEST"
      | "RATE_LIMITED"
      | "BUDGET_EXCEEDED",
    status: number,
    message: string,
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export class ControlLedger {
  private readonly db: DatabaseSync;
  private readonly timer: ReturnType<typeof setInterval>;
  private readonly now: () => number;
  constructor(path = ":memory:", now: () => number = Date.now) {
    this.now = now;
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON; PRAGMA journal_mode=DELETE;
      CREATE TABLE IF NOT EXISTS invites(id TEXT PRIMARY KEY, hash TEXT UNIQUE, expires INTEGER, uses INTEGER, maxUses INTEGER, revoked INTEGER);
      CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, invite TEXT, expires INTEGER, messages INTEGER DEFAULT 0, tokens INTEGER DEFAULT 0, spent INTEGER DEFAULT 0, active TEXT);
      CREATE TABLE IF NOT EXISTS days(day TEXT PRIMARY KEY, tokens INTEGER DEFAULT 0, spent INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS holds(id TEXT PRIMARY KEY, session TEXT, day TEXT, tokens INTEGER, cost INTEGER, expires INTEGER);
      CREATE TABLE IF NOT EXISTS rates(key TEXT PRIMARY KEY, minute INTEGER, count INTEGER);
      CREATE TABLE IF NOT EXISTS logs(id TEXT PRIMARY KEY, expires INTEGER, data TEXT);`);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS live_evaluation(id INTEGER PRIMARY KEY CHECK(id=1), attempts INTEGER NOT NULL DEFAULT 0, spent INTEGER NOT NULL DEFAULT 0);
      INSERT OR IGNORE INTO live_evaluation(id) VALUES(1);
      CREATE TABLE IF NOT EXISTS live_attempts(request TEXT PRIMARY KEY, hold TEXT UNIQUE NOT NULL, settled INTEGER NOT NULL DEFAULT 0);
    `);
    this.cleanup();
    this.timer = setInterval(() => {
      try {
        this.cleanup();
      } catch {
        /* Retry next tick; access paths fail closed if storage fails. */
      }
    }, 30000);
    this.timer.unref();
  }
  close() {
    clearInterval(this.timer);
    this.db.close();
  }
  private transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  createInvite(maxUses = 1, lifetimeMs = 86400000) {
    if (
      !Number.isInteger(maxUses) ||
      maxUses < 1 ||
      maxUses > 100 ||
      !Number.isInteger(lifetimeMs) ||
      lifetimeMs < 1000 ||
      lifetimeMs > 604800000
    )
      throw new Error("Invalid invitation limits.");
    const id = randomUUID(),
      code = randomBytes(32).toString("base64url");
    this.db
      .prepare("INSERT INTO invites VALUES(?,?,?,?,?,0)")
      .run(id, digest(code), this.now() + lifetimeMs, 0, maxUses);
    return { id, code, expiresAt: this.now() + lifetimeMs, maxUses };
  }
  revokeInvite(id: string) {
    if (!z.uuid().safeParse(id).success)
      throw new Error("Invalid invitation ID.");
    this.db.prepare("UPDATE invites SET revoked=1 WHERE id=?").run(id);
    this.cleanup();
  }
  rate(key: string, limit: number = securityPolicy.requestsPerMinute) {
    key = digest(key);
    this.transaction(() => {
      const minute = Math.floor(this.now() / 60000);
      this.db
        .prepare(
          "INSERT INTO rates VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN minute=excluded.minute THEN count+1 ELSE 1 END, minute=excluded.minute",
        )
        .run(key, minute);
    });
    const row = this.db
      .prepare("SELECT count FROM rates WHERE key=?")
      .get(key)!;
    if (Number(row.count) > limit)
      throw new AccessError(
        "RATE_LIMITED",
        429,
        "Please slow down and try again in a minute.",
      );
  }
  redeem(code: string, start: (token: string, expires: number) => void) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(code))
      throw new AccessError(
        "INVALID_REQUEST",
        401,
        "This invitation is unavailable. Ask the organiser for a valid invitation.",
      );
    this.cleanup();
    return this.transaction(() => {
      const invite = this.db
        .prepare(
          "SELECT * FROM invites WHERE hash=? AND revoked=0 AND expires>? AND uses<maxUses",
        )
        .get(digest(code), this.now());
      if (!invite)
        throw new AccessError(
          "INVALID_REQUEST",
          401,
          "This invitation is unavailable. Ask the organiser for a valid invitation.",
        );
      const token = randomBytes(32).toString("base64url"),
        expires = Math.min(
          this.now() + securityPolicy.sessionMs,
          Number(invite.expires),
        );
      start(token, expires);
      this.db
        .prepare("UPDATE invites SET uses=uses+1 WHERE id=?")
        .run(invite.id!);
      this.db
        .prepare("INSERT INTO sessions(hash,invite,expires) VALUES(?,?,?)")
        .run(digest(token), invite.id!, expires);
      return { token, expires };
    });
  }
  require(token: string | null): Access {
    this.cleanup();
    return this.readActive(token);
  }
  private readActive(token: string | null): Access {
    const row =
      token &&
      /^[A-Za-z0-9_-]{43}$/.test(token) &&
      this.db
        .prepare(
          "SELECT s.* FROM sessions s JOIN invites i ON i.id=s.invite WHERE s.hash=? AND s.expires>? AND i.revoked=0 AND i.expires>?",
        )
        .get(digest(token), this.now(), this.now());
    if (!row)
      throw new AccessError(
        "SESSION_EXPIRED",
        401,
        "This session has ended or expired. Redeem a valid invitation to continue.",
      );
    return {
      expires: Number(row.expires),
      messages: Number(row.messages),
      tokens: Number(row.tokens),
      spent: Number(row.spent),
      active: row.active as string | null,
    };
  }
  delete(token: string | null) {
    if (token)
      this.db.prepare("DELETE FROM sessions WHERE hash=?").run(digest(token));
  }
  acceptMessage(token: string) {
    this.require(token);
    const result = this.transaction(() => {
      this.readActive(token);
      return this.db
        .prepare(
          "UPDATE sessions SET messages=messages+1 WHERE hash=? AND messages<?",
        )
        .run(digest(token), securityPolicy.maxMessages);
    });
    if (!result.changes)
      throw new AccessError(
        "BUDGET_EXCEEDED",
        429,
        "This session has reached its 40-message limit. You can still browse confirmed catalogue results or clear the session.",
      );
  }
  reserve(
    token: string,
    tokens: number,
    costMicros = 0,
    liveRequestId?: string,
  ) {
    if (
      !Number.isSafeInteger(tokens) ||
      tokens < 1 ||
      !Number.isSafeInteger(costMicros) ||
      costMicros < 0
    )
      throw new ProviderError("BUDGET_EXCEEDED");
    if (
      liveRequestId !== undefined &&
      !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(liveRequestId)
    )
      throw new ProviderError("INVALID_REQUEST");
    this.require(token);
    return this.transaction(() => {
      this.readActive(token);
      const hash = digest(token),
        day = new Date(this.now()).toISOString().slice(0, 10);
      const session = this.db
        .prepare("SELECT * FROM sessions WHERE hash=?")
        .get(hash)!;
      this.db.prepare("INSERT OR IGNORE INTO days(day) VALUES(?)").run(day);
      const daily = this.db.prepare("SELECT * FROM days WHERE day=?").get(day)!;
      if (session.active) throw new ProviderError("RATE_LIMIT");
      if (liveRequestId !== undefined) {
        const evaluation = this.db
          .prepare("SELECT * FROM live_evaluation WHERE id=1")
          .get()!;
        if (
          costMicros < 1 ||
          costMicros > liveEvaluationPolicy.perRequestMicros ||
          Number(evaluation.attempts) >= liveAttemptCeiling() ||
          Number(evaluation.spent) + costMicros >
            liveEvaluationPolicy.totalBudgetMicros ||
          this.db
            .prepare("SELECT request FROM live_attempts WHERE request=?")
            .get(liveRequestId)
        )
          throw new ProviderError("BUDGET_EXCEEDED");
      }
      if (
        Number(session.tokens) + tokens > securityPolicy.sessionTokens ||
        Number(daily.tokens) + tokens > securityPolicy.dailyTokens ||
        Number(session.spent) + costMicros >
          securityPolicy.sessionBudgetMicros ||
        Number(daily.spent) + costMicros > securityPolicy.dailyBudgetMicros
      )
        throw new ProviderError("BUDGET_EXCEEDED");
      const id = randomUUID();
      if (liveRequestId !== undefined) {
        this.db
          .prepare(
            "UPDATE live_evaluation SET attempts=attempts+1,spent=spent+? WHERE id=1",
          )
          .run(costMicros);
        this.db
          .prepare("INSERT INTO live_attempts(request,hold) VALUES(?,?)")
          .run(liveRequestId, id);
      }
      // Charge the upper bound first; missing usage, timeout, crash and deletion cannot free it.
      this.db
        .prepare(
          "UPDATE sessions SET tokens=tokens+?,spent=spent+?,active=? WHERE hash=?",
        )
        .run(tokens, costMicros, id, hash);
      this.db
        .prepare("UPDATE days SET tokens=tokens+?,spent=spent+? WHERE day=?")
        .run(tokens, costMicros, day);
      this.db
        .prepare("INSERT INTO holds VALUES(?,?,?,?,?,?)")
        .run(id, hash, day, tokens, costMicros, this.now() + 35000);
      return id;
    });
  }
  settle(id: string, actualTokens: number | null, actualMicros: number | null) {
    this.transaction(() => {
      const hold = this.db.prepare("SELECT * FROM holds WHERE id=?").get(id);
      if (!hold) return;
      const bounded = (actual: number | null, max: number) =>
        actual !== null &&
        Number.isSafeInteger(actual) &&
        actual >= 0 &&
        actual <= max
          ? actual
          : max;
      const refundTokens =
        Number(hold.tokens) - bounded(actualTokens, Number(hold.tokens));
      const refundCost =
        Number(hold.cost) - bounded(actualMicros, Number(hold.cost));
      const liveAttempt = this.db
        .prepare("SELECT request FROM live_attempts WHERE hold=? AND settled=0")
        .get(id);
      if (liveAttempt) {
        this.db
          .prepare("UPDATE live_evaluation SET spent=spent-? WHERE id=1")
          .run(refundCost);
        this.db
          .prepare("UPDATE live_attempts SET settled=1 WHERE hold=?")
          .run(id);
      }
      this.db
        .prepare(
          "UPDATE sessions SET tokens=tokens-?,spent=spent-?,active=NULL WHERE hash=? AND active=?",
        )
        .run(refundTokens, refundCost, hold.session!, id);
      this.db
        .prepare("UPDATE days SET tokens=tokens-?,spent=spent-? WHERE day=?")
        .run(refundTokens, refundCost, hold.day!);
      this.db.prepare("DELETE FROM holds WHERE id=?").run(id);
    });
  }
  evaluationStatus() {
    const row = this.db
      .prepare("SELECT attempts,spent FROM live_evaluation WHERE id=1")
      .get()!;
    return {
      attempts: Number(row.attempts),
      spentMicros: Number(row.spent),
      ...liveEvaluationPolicy,
      maxAttempts: liveAttemptCeiling(),
    };
  }
  liveSpendGuard(
    token: string,
    metering: {
      reservedTokens: number;
      usedTokens: number | null;
      costMicros: number;
    },
  ): SpendGuard {
    return {
      reserve: async ({ requestId, maximumUsd, maximumTokens }) => {
        if (!Number.isFinite(maximumUsd) || maximumUsd <= 0 || !maximumTokens)
          throw new ProviderError("BUDGET_EXCEEDED");
        const cost = Math.ceil(maximumUsd * 1000000);
        const hold = this.reserve(token, maximumTokens, cost, requestId);
        metering.reservedTokens = maximumTokens;
        metering.costMicros = cost;
        return hold;
      },
      settle: async ({
        reservationId,
        estimatedUsd,
        actualTokens,
        outcome,
      }) => {
        const actualCost =
          outcome === "completed" && estimatedUsd !== null
            ? Math.ceil(estimatedUsd * 1000000)
            : null;
        const validTokens =
          actualTokens !== undefined &&
          actualTokens !== null &&
          Number.isSafeInteger(actualTokens) &&
          actualTokens >= 0 &&
          actualTokens <= metering.reservedTokens;
        const validCost =
          actualCost !== null &&
          Number.isSafeInteger(actualCost) &&
          actualCost >= 0 &&
          actualCost <= metering.costMicros;
        this.settle(
          reservationId,
          validTokens ? actualTokens : null,
          validCost ? actualCost : null,
        );
        metering.usedTokens = validTokens ? actualTokens : null;
        if (validCost) metering.costMicros = actualCost;
      },
    };
  }
  // Paid routes stay closed. This implements the existing provider's reservation port.
  spendGuard(token: string): SpendGuard {
    return {
      reserve: async ({ maximumUsd }) => {
        if (!Number.isFinite(maximumUsd) || maximumUsd <= 0 || maximumUsd > 0.1)
          return null;
        try {
          return this.reserve(token, 1, Math.ceil(maximumUsd * 1000000));
        } catch (error) {
          if (
            error instanceof ProviderError &&
            error.code === "BUDGET_EXCEEDED"
          )
            return null;
          throw error;
        }
      },
      settle: async ({ reservationId, estimatedUsd, outcome }) => {
        this.settle(
          reservationId,
          0,
          outcome === "completed" && estimatedUsd !== null
            ? Math.ceil(estimatedUsd * 1000000)
            : null,
        );
      },
    };
  }
  log(token: string, entry: Omit<z.input<typeof logSchema>, "sessionRef">) {
    const data = logSchema.parse({
      ...entry,
      sessionRef: digest(token).slice(0, 16),
    });
    this.db
      .prepare("INSERT INTO logs VALUES(?,?,?)")
      .run(
        randomUUID(),
        this.now() + securityPolicy.logRetentionMs,
        JSON.stringify(data),
      );
  }
  latestAiLog(token: string) {
    const row = this.db
      .prepare(
        "SELECT data FROM logs WHERE json_extract(data,'$.sessionRef')=? ORDER BY rowid DESC LIMIT 1",
      )
      .get(digest(token).slice(0, 16));
    return row ? logSchema.parse(JSON.parse(String(row.data))) : null;
  }
  cleanup() {
    const now = this.now();
    this.transaction(() => {
      this.db
        .prepare(
          "UPDATE sessions SET active=NULL WHERE active IN (SELECT id FROM holds WHERE expires<=?)",
        )
        .run(now);
      this.db.prepare("DELETE FROM holds WHERE expires<=?").run(now);
      this.db
        .prepare(
          "DELETE FROM sessions WHERE expires<=? OR invite IN (SELECT id FROM invites WHERE revoked=1 OR expires<=?)",
        )
        .run(now, now);
      this.db
        .prepare(
          "DELETE FROM invites WHERE expires<=? AND id NOT IN (SELECT invite FROM sessions)",
        )
        .run(now);
      this.db.prepare("DELETE FROM logs WHERE expires<=?").run(now);
      this.db
        .prepare("DELETE FROM rates WHERE minute<?")
        .run(Math.floor(now / 60000) - 1);
      this.db
        .prepare("DELETE FROM days WHERE day<?")
        .run(
          new Date(now - securityPolicy.logRetentionMs)
            .toISOString()
            .slice(0, 10),
        );
    });
  }
}
export function ledgerPath() {
  // Runtime control data must never be packaged into a Next deployment trace.
  const root = resolve(/* turbopackIgnore: true */ process.cwd()),
    configured =
      process.env.PROTOTYPE_CONTROL_DB ?? ".local/security/control.sqlite",
    path = resolve(/* turbopackIgnore: true */ root, configured);
  const normal = (value: string) => value.replaceAll("\\", "/"),
    local = [resolve(root, ".local"), resolve(root, ".cache")].some(
      (directory) => {
        const nested = relative(directory, path);
        return nested !== "" && !nested.startsWith("..") && !isAbsolute(nested);
      },
    );
  if (local) return path;

  const persistentRoot = process.env.PROTOTYPE_PERSISTENT_ROOT;
  if (
    isAbsolute(configured) &&
    process.env.PROTOTYPE_TRANSPORT === "https" &&
    persistentRoot &&
    isAbsolute(persistentRoot)
  ) {
    const allowedRoot = resolve(persistentRoot),
      nested = relative(allowedRoot, path);
    if (nested !== "" && !nested.startsWith("..") && !isAbsolute(nested))
      return path;
  }
  throw new Error(
    `Control database must stay in approved storage (${normal(root)}).`,
  );
}
