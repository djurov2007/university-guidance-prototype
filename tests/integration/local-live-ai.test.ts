import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { ControlLedger } from "@/server/security/control";
import { ConversationService } from "@/server/conversation/service";
import { handleRedeem, handleFlow } from "@/server/conversation/http";
import { parseAiConfig, readAiConfig } from "@/server/ai/config";
import { createOpenAIProvider } from "@/server/ai/openai-provider";
import {
  createLocalConversationProvider,
  localAiPolicy,
} from "@/server/ai/local-runtime";
import type { Scenario, SessionView } from "@/features/conversation/schema";

const FIXED = Date.parse("2026-10-11T12:00:00Z");
const ledgers: ControlLedger[] = [];
afterEach(() => {
  for (const l of ledgers.splice(0)) l.close();
});
function ledger(path = ":memory:", now = () => FIXED) {
  const l = new ControlLedger(path, now);
  ledgers.push(l);
  return l;
}
const selection = () => ({
  type: "answer",
  proposals: [{ field: "budgetAmount", valueJson: "9000", quote: "9000" }],
  questionId: null,
  answerKey: "profile_review",
  selections: [],
  permissionRequestIds: [],
});
function envelope(patch: Record<string, unknown> = {}) {
  return {
    model: "gpt-6-luna",
    status: "completed",
    output: [
      {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text: JSON.stringify(selection()) }],
      },
    ],
    usage: {
      input_tokens: 1000,
      input_tokens_details: { cached_tokens: 100 },
      output_tokens: 100,
    },
    ...patch,
  };
}
function rig(
  patch: Record<string, unknown> = {},
  options: {
    timeoutMs?: number;
    approved?: boolean;
    key?: string | undefined;
    asOf?: string | undefined;
    control?: ControlLedger;
  } = {},
) {
  const l = options.control ?? ledger();
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(envelope(patch), {
      headers: { "x-request-id": "req_local_test" },
    }),
  );
  const config = parseAiConfig({
    provider: "openai",
    liveApproved: options.approved ?? true,
    timeoutMs: options.timeoutMs ?? 12000,
  });
  const service = new ConversationService({
    control: l,
    now: () => FIXED,
    aiConfig: () => config,
    providerFactory: (_input, _scenario, guard) =>
      createOpenAIProvider({
        config,
        guard,
        fetcher,
        apiKey: options.key ?? "FAKE_SERVER_CREDENTIAL_SENTINEL",
        asOf: options.asOf ?? "2026-10-11",
      }),
  });
  let view: SessionView;
  const invite = l.createInvite(2);
  const { token } = l.redeem(invite.code, (token, expires) => {
    view = service.start({ action: "start", scenario: "bachelor" }, null, {
      token,
      expires,
    }).view;
  });
  return { l, fetcher, service, token, view: view!, invite };
}
const chat = (
  r: ReturnType<typeof rig>,
  message = "My study budget is 9000 EUR",
) =>
  r.service.mutate(r.token, "chat", {
    action: "message",
    revision: r.view.revision,
    message,
  });
function request(body: unknown, token?: string) {
  return new Request("http://127.0.0.1:3200/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:3200",
      ...(token ? { Cookie: `study_demo_session=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("local OpenAI conversation using fake HTTP only", () => {
  it("a lowered process ceiling blocks a second paid attempt without transport or quota reset", async () => {
    vi.stubEnv("PROTOTYPE_AI_ATTEMPT_CEILING", "1");
    const path = `.cache/live-tests/${randomUUID()}.sqlite`;
    const r = rig({}, { control: ledger(path) });
    const first = await chat(r);
    expect(first.issue).toBeNull();
    r.view = first;
    const second = await chat(r);
    expect(second.issue?.code).toBe("BUDGET_EXCEEDED");
    expect(r.fetcher).toHaveBeenCalledOnce();
    const reopened = ledger(path);
    expect(reopened.evaluationStatus()).toMatchObject({
      attempts: 1,
      maxAttempts: 1,
    });
    expect(() => reopened.reserve(r.token, 1, 1, randomUUID())).toThrow();
    expect(reopened.evaluationStatus().attempts).toBe(1);
  });
  it.each(["0", "201", "-1", "1.5", "", "01", "invalid", "9007199254740992"])(
    "closed or invalid process ceiling %j never reaches transport",
    async (ceiling) => {
      vi.stubEnv("PROTOTYPE_AI_ATTEMPT_CEILING", ceiling);
      const r = rig();
      expect((await chat(r)).issue).not.toBeNull();
      expect(r.fetcher).not.toHaveBeenCalled();
      if (ceiling === "0")
        expect(r.l.evaluationStatus()).toMatchObject({
          attempts: 0,
          maxAttempts: 0,
        });
      else expect(() => r.l.evaluationStatus()).toThrow("CONFIGURATION_ERROR");
    },
  );
  it("the paid attempt ceiling does not block ordinary mock reservations", () => {
    vi.stubEnv("PROTOTYPE_AI_ATTEMPT_CEILING", "0");
    const r = rig();
    const hold = r.l.reserve(r.token, 1, 1);
    r.l.settle(hold, 1, 1);
    expect(r.l.evaluationStatus().attempts).toBe(0);
  });
  it("reports the 200-attempt hard cap when no lower operator ceiling is set", () => {
    const r = rig();
    expect(r.l.evaluationStatus()).toMatchObject({
      attempts: 0,
      maxAttempts: 200,
      totalBudgetMicros: 2000000,
      perRequestMicros: 10000,
    });
  });
  it("stages explicit annual input through the full fake transport and only confirms it after user action", async () => {
    const s = selection();
    s.proposals = [
      {
        field: "fieldOfStudy",
        valueJson: '"computer science"',
        quote: "computer science",
      },
      { field: "budgetAmount", valueJson: "9000", quote: "9000" },
      { field: "budgetCurrency", valueJson: '"EUR"', quote: "EUR" },
      { field: "budgetPeriod", valueJson: '"year"', quote: "annual" },
    ];
    const r = rig({
      output: [
        {
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: JSON.stringify(s) }],
        },
      ],
    });
    const next = await chat(
      r,
      "I want to study computer science. My annual tuition budget is 9000 EUR.",
    );
    expect(next.issue).toBeNull();
    expect(next.fields.find((f) => f.key === "budgetPeriod")?.status).toBe(
      "extracted_unconfirmed",
    );
    expect(r.l.latestAiLog(r.token)?.diagnostics).toEqual([]);
    const confirmed = await r.service.mutate(r.token, "profile", {
      action: "confirm",
      revision: next.revision,
    });
    expect(
      confirmed.fields.find((f) => f.key === "budgetPeriod"),
    ).toMatchObject({ status: "confirmed", value: "year" });
    expect(confirmed.fields.find((f) => f.key === "studyLevel")?.status).toBe(
      "missing",
    );
    expect(confirmed.ready).toBe(false);
    expect(r.fetcher).toHaveBeenCalledOnce();
  });
  it("keeps specific semantic rule/field privately and accounts for rejected paid-shaped output", async () => {
    const s = selection();
    s.proposals = [
      { field: "budgetPeriod", valueJson: '"month"', quote: "annual" },
    ];
    const r = rig({
      output: [
        {
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: JSON.stringify(s) }],
        },
      ],
    });
    const next = await chat(r, "My annual study budget is 9000 EUR.");
    expect(next.issue?.code).toBe("MODEL_INVALID_OUTPUT");
    expect(next.profileRevision).toBe(r.view.profileRevision);
    expect(r.l.latestAiLog(r.token)?.diagnostics).toEqual([
      {
        reason: "SEMANTIC_SELECTION_REJECTED",
        rule: "BUDGET_PERIOD_NOT_GROUNDED",
        field: "budgetPeriod",
        proposalIndex: 0,
      },
    ]);
    expect(JSON.stringify(next)).not.toContain("BUDGET_PERIOD_NOT_GROUNDED");
    expect(r.l.evaluationStatus()).toMatchObject({
      attempts: 1,
      spentMicros: 141,
    });
    expect(r.fetcher).toHaveBeenCalledOnce();
  });
  it("persists safe validation diagnostics privately without exposing them in the session", async () => {
    const r = rig({ model: "PRIVATE_MODEL_SENTINEL" });
    const next = await chat(r);
    expect(next.issue?.code).toBe("MODEL_INVALID_OUTPUT");
    expect(next.profileRevision).toBe(r.view.profileRevision);
    const entry = r.l.latestAiLog(r.token)!;
    expect(entry.diagnostics).toEqual([
      { reason: "MODEL_MISMATCH", httpStatus: 200 },
    ]);
    expect(entry.providerRequestIds).toEqual(["req_local_test"]);
    expect(entry.usageKnown).toBe(false);
    expect(entry.estimatedCostMicros).toBeGreaterThan(0);
    expect(JSON.stringify(entry)).not.toContain("PRIVATE_MODEL_SENTINEL");
    expect(JSON.stringify(next)).not.toContain("MODEL_MISMATCH");
    expect(next).not.toHaveProperty("diagnostics");
    expect(r.l.evaluationStatus().attempts).toBe(1);
    expect(r.fetcher).toHaveBeenCalledOnce();
  });
  it("an exhausted evaluation blocks transport and preserves the profile", async () => {
    const r = rig();
    for (let i = 0; i < 200; i++) {
      const hold = r.l.reserve(r.token, 1, 1, randomUUID());
      r.l.settle(hold, 0, 0);
    }
    const next = await chat(r);
    expect(next.issue?.code).toBe("BUDGET_EXCEEDED");
    expect(next.profileRevision).toBe(r.view.profileRevision);
    expect(r.fetcher).not.toHaveBeenCalled();
  });
  it("changing from mock to external AI requires fresh notice acceptance", async () => {
    const l = ledger();
    const s = new ConversationService({
      control: l,
      now: () => FIXED,
      aiConfig: readAiConfig,
      providerFactory: createLocalConversationProvider,
    });
    let view!: SessionView;
    const { token } = l.redeem(l.createInvite().code, (token, expires) => {
      view = s.start({ action: "start", scenario: "bachelor" }, null, {
        token,
        expires,
      }).view;
    });
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_LIVE_APPROVED", "true");
    await expect(
      s.mutate(token, "chat", {
        action: "message",
        revision: view.revision,
        message: "My study budget is 9000 EUR",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(fetch).not.toHaveBeenCalled();
    expect(l.evaluationStatus().attempts).toBe(0);
  });
  it("uses one reservation, accounts real usage, logs safe metering and requires confirmation", async () => {
    const path = `.cache/live-tests/${randomUUID()}.sqlite`;
    const r = rig({}, { control: ledger(path) });
    const next = await chat(r);
    expect(next.issue).toBeNull();
    const budget = next.fields.find((f) => f.key === "budgetAmount")!;
    expect(budget.status).toBe("extracted_unconfirmed");
    expect(budget.proposals).toHaveLength(1);
    expect(r.fetcher).toHaveBeenCalledOnce();
    expect(r.l.require(r.token)).toMatchObject({
      tokens: 1100,
      spent: 141,
      active: null,
    });
    expect(r.l.evaluationStatus()).toMatchObject({
      attempts: 1,
      spentMicros: 141,
    });
    expect(r.l.latestAiLog(r.token)).toMatchObject({
      returnedModel: "gpt-6-luna",
      providerRequestIds: ["req_local_test"],
      usage: { inputTokens: 1000, cachedInputTokens: 100, outputTokens: 100 },
    });
    const db = new DatabaseSync(path);
    const logs = db.prepare("SELECT data FROM logs").all();
    db.close();
    const data = JSON.parse(String(logs[0]!.data));
    expect(data).toMatchObject({
      estimatedCostMicros: 141,
      usageKnown: true,
      providerRequestIds: ["req_local_test"],
      pricingVersion: "standard-short-2026-10-11-luna",
    });
    expect(JSON.stringify(logs)).not.toContain(
      "FAKE_SERVER_CREDENTIAL_SENTINEL",
    );
    expect(JSON.stringify(logs)).not.toContain("My study budget");
    const confirmed = await r.service.mutate(r.token, "profile", {
      action: "confirm",
      revision: next.revision,
    });
    expect(confirmed.fields.find((f) => f.key === "budgetAmount")?.status).toBe(
      "confirmed",
    );
  });
  it.each([401, 403, 429, 500])(
    "HTTP %i retains conservative reservation, does not retry or modify profile",
    async (status) => {
      const r = rig();
      r.fetcher.mockResolvedValue(new Response("PRIVATE_ERROR", { status }));
      const next = await chat(r);
      expect(next.issue).not.toBeNull();
      expect(next.profileRevision).toBe(r.view.profileRevision);
      expect(r.fetcher).toHaveBeenCalledOnce();
      expect(r.l.evaluationStatus().attempts).toBe(1);
      expect(r.l.evaluationStatus().spentMicros).toBeGreaterThan(141);
      expect(r.l.require(r.token).active).toBeNull();
      expect(JSON.stringify(next)).not.toContain("PRIVATE_ERROR");
    },
  );
  it.each(["approval", "key", "stale-price", "missing-ledger"])(
    "%s gate sends no HTTP",
    async (gate) => {
      const r = rig(
        {},
        {
          approved: gate !== "approval",
          key: gate === "key" ? "" : undefined,
          asOf: gate === "stale-price" ? "2026-10-23" : undefined,
        },
      );
      if (gate === "missing-ledger") {
        const s = new ConversationService({
          aiConfig: () =>
            parseAiConfig({ provider: "openai", liveApproved: true }),
          providerFactory: (_i, _s, guard) =>
            createOpenAIProvider({
              config: parseAiConfig({ provider: "openai", liveApproved: true }),
              guard,
              fetcher: r.fetcher,
              apiKey: "FAKE",
              asOf: "2026-10-11",
            }),
        });
        const start = s.start({ action: "start", scenario: "bachelor" });
        const next = await s.mutate(start.token, "chat", {
          action: "message",
          revision: 0,
          message: "My study budget is 9000 EUR",
        });
        expect(next.issue).not.toBeNull();
      } else expect((await chat(r)).issue).not.toBeNull();
      expect(r.fetcher).not.toHaveBeenCalled();
      expect(r.l.evaluationStatus().attempts).toBe(0);
    },
  );
  it.each([
    "invalid-json",
    "unknown-source",
    "refusal",
    "incomplete",
    "oversize-usage",
    "oversize-body",
    "network",
    "timeout",
    "unknown-usage",
  ])("handles %s safely in the integrated flow", async (failure) => {
    const r = rig({}, { timeoutMs: 30 });
    if (failure === "invalid-json")
      r.fetcher.mockResolvedValue(new Response("not JSON"));
    if (failure === "unknown-source")
      r.fetcher.mockResolvedValue(
        Response.json(
          envelope({
            output: [
              {
                type: "message",
                role: "assistant",
                status: "completed",
                content: [
                  {
                    type: "output_text",
                    text: JSON.stringify({
                      ...selection(),
                      selections: [
                        {
                          programId: "invented",
                          intakeId: "invented",
                          reasonCodes: ["invented"],
                          sourceIds: ["invented"],
                        },
                      ],
                    }),
                  },
                ],
              },
            ],
          }),
        ),
      );
    if (failure === "refusal")
      r.fetcher.mockResolvedValue(
        Response.json(
          envelope({
            output: [
              {
                type: "message",
                role: "assistant",
                status: "completed",
                content: [{ type: "refusal", refusal: "PRIVATE" }],
              },
            ],
          }),
        ),
      );
    if (failure === "incomplete")
      r.fetcher.mockResolvedValue(
        Response.json(envelope({ status: "incomplete", output: [] })),
      );
    if (failure === "oversize-usage")
      r.fetcher.mockResolvedValue(
        Response.json(
          envelope({ usage: { input_tokens: 1000000, output_tokens: 100 } }),
        ),
      );
    if (failure === "oversize-body")
      r.fetcher.mockResolvedValue(new Response("x".repeat(65537)));
    if (failure === "network")
      r.fetcher.mockRejectedValue(new Error("PRIVATE_NETWORK"));
    if (failure === "timeout")
      r.fetcher.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new Error("aborted")),
            ),
          ),
      );
    if (failure === "unknown-usage")
      r.fetcher.mockResolvedValue(Response.json(envelope({ usage: null })));
    const next = await chat(r);
    if (failure === "unknown-usage") {
      expect(next.issue).toBeNull();
      expect(next.fields.find((f) => f.key === "budgetAmount")?.status).toBe(
        "extracted_unconfirmed",
      );
    } else {
      expect(next.issue).not.toBeNull();
      expect(next.profileRevision).toBe(r.view.profileRevision);
    }
    expect(r.fetcher).toHaveBeenCalledOnce();
    expect(r.l.evaluationStatus().attempts).toBe(1);
    expect(r.l.evaluationStatus().spentMicros).toBeGreaterThan(0);
    expect(JSON.stringify(next)).not.toContain("PRIVATE");
  });
  it("blocks a second concurrent request and does not resurrect a deleted profile", async () => {
    const r = rig();
    let release!: (response: Response) => void;
    r.fetcher.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const pending = chat(r);
    await vi.waitFor(() => expect(r.fetcher).toHaveBeenCalledOnce());
    await expect(chat(r)).rejects.toMatchObject({ code: "RATE_LIMITED" });
    r.service.delete(r.token);
    r.l.delete(r.token);
    release(Response.json(envelope()));
    await expect(pending).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(r.l.evaluationStatus()).toMatchObject({
      attempts: 1,
      spentMicros: 141,
    });
  });
  it("requires the new notice before redeeming a live session and rejects cross-origin", async () => {
    const r = rig();
    const body = {
      code: r.invite.code,
      adult: true,
      privacyNoticeAccepted: true,
      scenario: "bachelor",
      noticeVersion: "synthetic-privacy-1",
    };
    expect((await handleRedeem(request(body), r.service, r.l)).status).toBe(
      400,
    );
    const hostile = request({ ...body, noticeVersion: "synthetic-openai-1" });
    hostile.headers.set("Origin", "https://evil.example");
    expect((await handleRedeem(hostile, r.service, r.l)).status).toBe(403);
    const redeemed = await handleRedeem(
      request({ ...body, noticeVersion: "synthetic-openai-1" }),
      r.service,
      r.l,
    );
    expect(redeemed.status).toBe(200);
    expect(r.fetcher).not.toHaveBeenCalled();
    const token = /study_demo_session=([^;]+)/.exec(
      redeemed.headers.get("set-cookie")!,
    )![1]!;
    const response = await handleFlow(
      request(
        {
          action: "message",
          revision: 0,
          message: "My study budget is 9000 EUR",
        },
        token,
      ),
      "chat",
      r.service,
      r.l,
    );
    expect(response.status).toBe(200);
    expect(r.fetcher).toHaveBeenCalledOnce();
  });
  it("stays mock by default and connects approved synthetic and reviewed-catalogue scenarios", async () => {
    const now = () => Date.parse("2026-10-17T12:00:00Z");
    const l = ledger(":memory:", now);
    const s = new ConversationService({
      control: l,
      now,
      aiConfig: readAiConfig,
      providerFactory: createLocalConversationProvider,
    });
    expect(localAiPolicy().externalAi).toBe(false);
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_LIVE_APPROVED", "true");
    vi.stubEnv("AI_MODEL", "gpt-6-luna");
    expect(localAiPolicy().liveAiEnabled).toBe(true);
    vi.mocked(fetch).mockImplementation(async () => Response.json(envelope()));
    for (const scenario of [
      "bachelor",
      "published",
      "provider_unavailable",
    ] as Scenario[]) {
      let view!: SessionView;
      const { token } = l.redeem(l.createInvite().code, (token, expires) => {
        view = s.start({ action: "start", scenario }, null, {
          token,
          expires,
        }).view;
      });
      await s.mutate(token, "chat", {
        action: "message",
        revision: view.revision,
        message: "My study budget is 9000 EUR",
      });
    }
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(l.evaluationStatus().attempts).toBe(2);
    vi.stubEnv("AI_MODEL", "gpt-6.1-sol");
    expect(localAiPolicy().liveAiEnabled).toBe(false);
  });
});

describe("durable whole-evaluation limits", () => {
  it("the overall money ceiling is checked before a reservation across connections", () => {
    const path = `.cache/live-tests/${randomUUID()}.sqlite`;
    const l = ledger(path);
    const db = new DatabaseSync(path);
    db.prepare("UPDATE live_evaluation SET spent=1999999 WHERE id=1").run();
    db.close();
    const reopened = ledger(path);
    const { token } = reopened.redeem(reopened.createInvite().code, () => {});
    expect(() => reopened.reserve(token, 1, 2, randomUUID())).toThrow(
      "BUDGET_EXCEEDED",
    );
    expect(l.evaluationStatus()).toMatchObject({
      attempts: 0,
      spentMicros: 1999999,
    });
  });
  it("attempt limit survives refunds, deletion, restart and daily reset", () => {
    let now = FIXED;
    const path = `.cache/live-tests/${randomUUID()}.sqlite`;
    const l = ledger(path, () => now);
    for (let i = 0; i < 200; i++) {
      const { token } = l.redeem(l.createInvite().code, () => {});
      const hold = l.reserve(token, 100, 1000, randomUUID());
      l.settle(hold, 10, 10);
      l.settle(hold, 0, 0);
      l.delete(token);
    }
    now += 86400000;
    l.cleanup();
    const reopened = ledger(path, () => now);
    const { token } = reopened.redeem(reopened.createInvite().code, () => {});
    expect(reopened.evaluationStatus()).toMatchObject({
      attempts: 200,
      spentMicros: 2000,
    });
    expect(() => reopened.reserve(token, 1, 1, randomUUID())).toThrow(
      "BUDGET_EXCEEDED",
    );
  }, 15000);
  it("rejects duplicate attempt IDs, per-call overrun, concurrent holds and retains crash maximum", () => {
    let now = FIXED;
    const path = `.cache/live-tests/${randomUUID()}.sqlite`;
    const l = ledger(path, () => now);
    const second = ledger(path, () => now);
    const { token } = l.redeem(l.createInvite().code, () => {});
    const id = randomUUID();
    expect(() => l.reserve(token, 100, 10001, id)).toThrow("BUDGET_EXCEEDED");
    const hold = l.reserve(token, 100, 10000, id);
    expect(() => second.reserve(token, 100, 10000, randomUUID())).toThrow(
      "RATE_LIMIT",
    );
    now += 35001;
    second.cleanup();
    second.settle(hold, 0, 0);
    expect(second.evaluationStatus()).toMatchObject({
      attempts: 1,
      spentMicros: 10000,
    });
    expect(() => second.reserve(token, 100, 10000, id)).toThrow(
      "BUDGET_EXCEEDED",
    );
    expect(second.require(token)).toMatchObject({
      tokens: 100,
      spent: 10000,
      active: null,
    });
  });
});
