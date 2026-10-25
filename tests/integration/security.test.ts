import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  ControlLedger,
  ledgerPath,
  securityPolicy,
} from "../../src/server/security/control";
import { resolve } from "node:path";
import { ConversationService } from "../../src/server/conversation/service";
import {
  handleRedeem,
  handleFlow,
  handleDetails,
  handleDelete,
  handleUpload,
} from "../../src/server/conversation/http";
const ledgers: ControlLedger[] = [];
const ledger = (path = ":memory:", now = Date.now) => {
  const l = new ControlLedger(path, now);
  ledgers.push(l);
  return l;
};
afterEach(() => {
  for (const l of ledgers.splice(0)) l.close();
});
const req = (
  body: unknown,
  token?: string,
  origin = "http://127.0.0.1:3000",
  method = "POST",
) =>
  new Request("http://127.0.0.1:3000/api/session/redeem", {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(token ? { Cookie: `study_demo_session=${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const access = (l: ControlLedger, uses = 1) => {
  const invitation = l.createInvite(uses);
  return { ...l.redeem(invitation.code, () => {}), invitation };
};
const redeemBody = (code: string) => ({
  code,
  adult: true,
  privacyNoticeAccepted: true,
  noticeVersion: "synthetic-privacy-1",
  scenario: "bachelor",
});
describe("durable invitation and budget control", () => {
  it("single-use and bounded multi-use codes, invalid/expired/revoked codes fail closed", () => {
    let now = Date.now();
    const l = ledger(":memory:", () => now),
      a = access(l);
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(() => l.redeem(a.invitation.code, () => {})).toThrow();
    const b = l.createInvite(2, 1000);
    l.redeem(b.code, () => {});
    l.redeem(b.code, () => {});
    expect(() => l.redeem(b.code, () => {})).toThrow();
    l.revokeInvite(a.invitation.id);
    expect(() => l.require(a.token)).toThrow();
    const c = l.createInvite(1, 1000);
    now += 1001;
    expect(() => l.redeem(c.code, () => {})).toThrow();
    expect(() => l.redeem("x".repeat(43), () => {})).toThrow();
  });
  it("rolls back invite consumption when profile creation fails", () => {
    const l = ledger(),
      i = l.createInvite();
    expect(() =>
      l.redeem(i.code, () => {
        throw new Error();
      }),
    ).toThrow();
    expect(l.redeem(i.code, () => {}).token).toBeTruthy();
  });
  it("preserves spent quotas and invite use across connections and restart, with no raw bearer stored", () => {
    const path = `.cache/security-unit/${randomUUID()}.sqlite`,
      l = ledger(path),
      a = access(l);
    l.acceptMessage(a.token);
    const hold = l.reserve(a.token, 100, 1000);
    l.settle(hold, null, null);
    const second = ledger(path);
    expect(second.require(a.token)).toMatchObject({
      messages: 1,
      tokens: 100,
      spent: 1000,
    });
    expect(() => second.redeem(a.invitation.code, () => {})).toThrow();
    const db = new DatabaseSync(path);
    const values =
      JSON.stringify(db.prepare("SELECT * FROM sessions").all()) +
      JSON.stringify(db.prepare("SELECT * FROM invites").all());
    db.close();
    expect(values).not.toContain(a.token);
    expect(values).not.toContain(a.invitation.code);
  });
  it("reserves before work, enforces one active call, settles idempotently and charges unknown use", () => {
    let now = Date.now();
    const l = ledger(":memory:", () => now),
      a = access(l),
      hold = l.reserve(a.token, 100, 1000);
    expect(() => l.reserve(a.token, 1)).toThrow("RATE_LIMIT");
    l.settle(hold, 40, 300);
    l.settle(hold, 0, 0);
    expect(l.require(a.token)).toMatchObject({
      tokens: 40,
      spent: 300,
      active: null,
    });
    l.reserve(a.token, 100, 1000);
    now += 35001;
    l.cleanup();
    expect(l.require(a.token)).toMatchObject({
      tokens: 140,
      spent: 1300,
      active: null,
    });
  });
  it("session and global token/cost limits stop work, including after deletion", () => {
    const l = ledger(),
      a = access(l),
      b = access(l);
    expect(() => l.reserve(a.token, securityPolicy.sessionTokens + 1)).toThrow(
      "BUDGET_EXCEEDED",
    );
    expect(() =>
      l.reserve(a.token, 1, securityPolicy.sessionBudgetMicros + 1),
    ).toThrow("BUDGET_EXCEEDED");
    for (let n = 0; n < 8; n++) {
      const c = access(l);
      l.reserve(c.token, 250000);
      l.delete(c.token);
    }
    expect(() => l.reserve(b.token, 1)).toThrow("BUDGET_EXCEEDED");
  });
  it("limits messages and failed redemption attempts without logging payloads", () => {
    const l = ledger(),
      a = access(l);
    for (let n = 0; n < 40; n++) l.acceptMessage(a.token);
    expect(() => l.acceptMessage(a.token)).toThrow(/40-message/);
    for (let n = 0; n < 20; n++) l.rate("redeem-global", 20);
    expect(() => l.rate("redeem-global", 20)).toThrow();
    expect(() =>
      l.log(a.token, {
        requestId: randomUUID(),
        task: "interpret_message",
        model: "mock",
        durationMs: 1,
        tokens: 0,
        usageKnown: false,
        estimatedCostMicros: 0,
        errorCode: null,
        instructionVersion: "education-instructions-1",
        message: "PRIVATE",
      } as never),
    ).toThrow();
  });
  it("executes expiry and 24h log retention cleanup", () => {
    let now = Date.now();
    const path = `.cache/security-unit/${randomUUID()}.sqlite`,
      l = ledger(path, () => now),
      a = access(l);
    l.log(a.token, {
      requestId: randomUUID(),
      task: "interpret_message",
      model: "mock",
      durationMs: 1,
      tokens: 0,
      usageKnown: false,
      estimatedCostMicros: 0,
      errorCode: null,
      instructionVersion: "education-instructions-1",
    });
    now += securityPolicy.sessionMs + 1;
    expect(() => l.require(a.token)).toThrow();
    now += securityPolicy.logRetentionMs;
    l.cleanup();
    const db = new DatabaseSync(path);
    expect(db.prepare("SELECT count(*) AS n FROM logs").get()?.n).toBe(0);
    db.close();
  });
});
describe("invited HTTP and profile isolation", () => {
  it("requires invitation, adult declaration, notice, same-origin and private cookie", async () => {
    const l = ledger(),
      s = new ConversationService({ control: l });
    expect(
      (
        await handleFlow(
          req({ action: "start", scenario: "bachelor" }),
          "chat",
          s,
          l,
        )
      ).status,
    ).toBe(401);
    const i = l.createInvite(3);
    expect(
      (await handleRedeem(req({ ...redeemBody(i.code), adult: false }), s, l))
        .status,
    ).toBe(400);
    expect(
      (
        await handleRedeem(
          req(redeemBody(i.code), undefined, "https://evil.example"),
          s,
          l,
        )
      ).status,
    ).toBe(403);
    const noOrigin = req(redeemBody(i.code));
    noOrigin.headers.delete("origin");
    expect((await handleRedeem(noOrigin, s, l)).status).toBe(403);
    const response = await handleRedeem(req(redeemBody(i.code)), s, l);
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=strict");
    const secure = new Request("https://localhost/api/session/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost",
      },
      body: JSON.stringify(redeemBody(i.code)),
    });
    expect(
      (await handleRedeem(secure, s, l)).headers.get("set-cookie"),
    ).toContain("Secure");
  });
  it("cannot read another session by invented IDs or reset quota/expiry via start; delete and revoke stop access", async () => {
    const l = ledger(),
      s = new ConversationService({ control: l }),
      i = l.createInvite(2);
    const a = await handleRedeem(req(redeemBody(i.code)), s, l),
      b = await handleRedeem(req(redeemBody(i.code)), s, l);
    const token = (r: Response) =>
      /study_demo_session=([^;]+)/.exec(r.headers.get("set-cookie")!)![1]!;
    const at = token(a),
      bt = token(b);
    expect(s.resume(at).scenario).toBe("bachelor");
    expect(s.resume(bt).scenario).toBe("bachelor");
    l.acceptMessage(at);
    const before = l.require(at);
    const reset = await handleFlow(
      req({ action: "start", scenario: "master" }, at),
      "chat",
      s,
      l,
    );
    expect(reset.status).toBe(200);
    expect(l.require(at)).toEqual(before);
    expect(
      (
        await handleDetails(
          req(undefined, bt, "http://127.0.0.1:3000", "GET"),
          at,
          s,
          l,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await handleFlow(
          req({ action: "resume", sessionId: at }, bt),
          "chat",
          s,
          l,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleFlow(
          req({ action: "resume" }, "x".repeat(43)),
          "chat",
          s,
          l,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await handleDelete(
          req(undefined, at, "http://127.0.0.1:3000", "DELETE"),
          s,
          l,
        )
      ).status,
    ).toBe(200);
    expect(() => l.require(at)).toThrow();
    l.revokeInvite(i.id);
    expect(() => s.resume(bt)).toThrow();
    expect(handleUpload(req({})).status).toBe(403);
  });
});

describe("additional quota and lifecycle regressions", () => {
  it("enforces the daily financial stop across deleted sessions", () => {
    const l = ledger();
    for (let n = 0; n < 5; n++) {
      const a = access(l);
      l.reserve(a.token, 1, 100000);
      l.delete(a.token);
    }
    const a = access(l);
    expect(() => l.reserve(a.token, 1, 1)).toThrow("BUDGET_EXCEEDED");
  });
  it("shares active reservations across connections and retains charges after reopen", () => {
    const path = `.cache/security-unit/${randomUUID()}.sqlite`,
      a = ledger(path),
      b = ledger(path),
      s = access(a);
    const hold = a.reserve(s.token, 123, 456);
    expect(() => b.reserve(s.token, 1)).toThrow("RATE_LIMIT");
    b.settle(hold, null, null);
    const reopened = ledger(path);
    expect(reopened.require(s.token)).toMatchObject({
      tokens: 123,
      spent: 456,
      active: null,
    });
  });
  it("returns BUDGET_EXCEEDED before provider execution and preserves profile", async () => {
    const l = ledger();
    let calls = 0;
    const s = new ConversationService({
      control: l,
      providerFactory: () => ({
        kind: "mock",
        model: "mock",
        version: "test",
        async generate() {
          calls++;
          throw new Error("PRIVATE ERROR");
        },
      }),
    });
    let view: ReturnType<ConversationService["resume"]> | undefined;
    const a = l.redeem(l.createInvite().code, (token, expires) => {
      view = s.start({ action: "start", scenario: "bachelor" }, null, {
        token,
        expires,
      }).view;
    });
    const hold = l.reserve(a.token, securityPolicy.sessionTokens);
    l.settle(hold, null, 0);
    const result = await s.mutate(a.token, "chat", {
      action: "message",
      revision: view!.revision,
      message: "My budget is 10000 EUR",
    });
    expect(result.issue?.code).toBe("BUDGET_EXCEEDED");
    expect(calls).toBe(0);
    expect(result.profileRevision).toBe(view!.profileRevision);
  });
  it("opposition/deletion during a pending AI request prevents a late profile commit", async () => {
    const l = ledger();
    let release: () => void = () => {};
    const s = new ConversationService({
      control: l,
      providerFactory: () => ({
        kind: "mock",
        model: "mock",
        version: "test",
        async generate() {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          throw new Error("private");
        },
      }),
    });
    const invite = l.createInvite();
    let view: ReturnType<ConversationService["resume"]> | undefined;
    const a = l.redeem(invite.code, (token, expires) => {
      view = s.start({ action: "start", scenario: "bachelor" }, null, {
        token,
        expires,
      }).view;
    });
    const pending = s.mutate(a.token, "chat", {
      action: "message",
      revision: view!.revision,
      message: "My budget is 10000 EUR",
    });
    l.revokeInvite(invite.id);
    release();
    await expect(pending).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(() => s.resume(a.token)).toThrow();
  });
});

it("the existing SpendGuard port reserves before transport, fails on exhaustion and settles unknown cost conservatively", async () => {
  const l = ledger(),
    a = access(l),
    guard = l.spendGuard(a.token);
  for (let n = 0; n < 2; n++) {
    const id = await guard.reserve({
      requestId: randomUUID(),
      maximumUsd: 0.04,
    });
    expect(id).toBeTruthy();
    await guard.settle({
      reservationId: id!,
      estimatedUsd: null,
      outcome: "unknown",
    });
  }
  const id = await guard.reserve({ requestId: randomUUID(), maximumUsd: 0.02 });
  expect(id).toBeTruthy();
  await guard.settle({
    reservationId: id!,
    estimatedUsd: 0.01,
    outcome: "completed",
  });
  expect(l.require(a.token).spent).toBe(90000);
  expect(
    await guard.reserve({ requestId: randomUUID(), maximumUsd: 0.02 }),
  ).toBeNull();
});

it("explicit HTTPS mode rejects plain HTTP, and duplicate cookies cannot resume access", async () => {
  const l = ledger(),
    s = new ConversationService({ control: l }),
    i = l.createInvite();
  const response = await handleRedeem(req(redeemBody(i.code)), s, l);
  const token = /study_demo_session=([^;]+)/.exec(
    response.headers.get("set-cookie")!,
  )![1]!;
  const duplicate = req({ action: "resume" }, token);
  duplicate.headers.set(
    "cookie",
    `study_demo_session=${token}; study_demo_session=${token}`,
  );
  expect((await handleFlow(duplicate, "chat", s, l)).status).toBe(401);
  const previous = process.env.PROTOTYPE_TRANSPORT;
  const previousOrigin = process.env.PROTOTYPE_PUBLIC_ORIGIN;
  try {
    process.env.PROTOTYPE_TRANSPORT = "https";
    process.env.PROTOTYPE_PUBLIC_ORIGIN = "https://preview.example";
    expect(
      (await handleFlow(req({ action: "resume" }, token), "chat", s, l)).status,
    ).toBe(403);

    const cloud = (origin = "https://preview.example") =>
      new Request("http://internal:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `study_demo_session=${token}`,
          Host: "preview.example",
          Origin: origin,
          "X-Forwarded-Proto": "https",
        },
        body: JSON.stringify({ action: "resume" }),
      });
    expect((await handleFlow(cloud(), "chat", s, l)).status).toBe(200);
    expect(
      (await handleFlow(cloud("https://evil.example"), "chat", s, l)).status,
    ).toBe(403);
    const spoofed = cloud();
    spoofed.headers.set("x-forwarded-host", "evil.example");
    expect((await handleFlow(spoofed, "chat", s, l)).status).toBe(403);
  } finally {
    if (previous === undefined) delete process.env.PROTOTYPE_TRANSPORT;
    else process.env.PROTOTYPE_TRANSPORT = previous;
    if (previousOrigin === undefined)
      delete process.env.PROTOTYPE_PUBLIC_ORIGIN;
    else process.env.PROTOTYPE_PUBLIC_ORIGIN = previousOrigin;
  }
});

it("allows an absolute control database only inside an explicit HTTPS persistent root", () => {
  const previous = {
    db: process.env.PROTOTYPE_CONTROL_DB,
    root: process.env.PROTOTYPE_PERSISTENT_ROOT,
    transport: process.env.PROTOTYPE_TRANSPORT,
  };
  const root = resolve("..", ".prototype-volume"),
    database = resolve(root, "control.sqlite");
  try {
    process.env.PROTOTYPE_TRANSPORT = "https";
    process.env.PROTOTYPE_PERSISTENT_ROOT = root;
    process.env.PROTOTYPE_CONTROL_DB = database;
    expect(ledgerPath()).toBe(database);
    process.env.PROTOTYPE_CONTROL_DB = resolve(root, "..", "escape.sqlite");
    expect(() => ledgerPath()).toThrow("approved storage");
  } finally {
    for (const [key, value] of Object.entries({
      PROTOTYPE_CONTROL_DB: previous.db,
      PROTOTYPE_PERSISTENT_ROOT: previous.root,
      PROTOTYPE_TRANSPORT: previous.transport,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
