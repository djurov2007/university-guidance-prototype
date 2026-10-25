import { describe, expect, it, vi } from "vitest";
import { createOpenAIProvider } from "@/server/ai/openai-provider";
import {
  createEducationAdapter,
  EDUCATION_INSTRUCTIONS,
} from "@/server/ai/education-adapter";
import { parseAiConfig } from "@/server/ai/config";
import type { ProviderRequest, SpendGuard } from "@/server/ai/provider";
import { aiFixture } from "@/test-fixtures/ai";

const request: ProviderRequest = {
  requestId: "synthetic-transport",
  contextJson: '{"task":"explain_recommendations","message":"study"}',
  instructions: EDUCATION_INSTRUCTIONS,
  maxOutputTokens: 1600,
  timeoutMs: 500,
  maxCostUsd: 0.01,
};
function fakeGuard() {
  return {
    reserve: vi
      .fn<SpendGuard["reserve"]>()
      .mockResolvedValue("synthetic-reservation"),
    settle: vi.fn<SpendGuard["settle"]>().mockResolvedValue(undefined),
  };
}
function envelope(patch: Record<string, unknown> = {}) {
  return {
    model: "gpt-6-luna",
    status: "completed",
    output: [
      {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [
          { type: "output_text", text: JSON.stringify(aiFixture().selection) },
        ],
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
function make(patch: Record<string, unknown> = {}, asOf = "2026-10-06") {
  const guard = fakeGuard(),
    fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(envelope(patch), {
        headers: { "x-request-id": "req_transport" },
      }),
    );
  const config = parseAiConfig({ provider: "openai", liveApproved: true });
  const provider = createOpenAIProvider({
    config,
    apiKey: "FAKE_SERVER_CREDENTIAL_SENTINEL",
    guard,
    fetcher,
    asOf,
  });
  return { guard, fetcher, config, provider };
}
describe("OpenAI Responses HTTP transport using fake fetch only", () => {
  it("prices cache writes as a disjoint input partition and reserves the worst input rate before HTTP", async () => {
    const f = make(
      {
        usage: {
          input_tokens: 1000,
          input_tokens_details: { cached_tokens: 100, cache_write_tokens: 200 },
          output_tokens: 100,
        },
      },
      "2026-10-15",
    );
    const out = await f.provider.generate(
      request,
      new AbortController().signal,
    );
    expect(out.usage).toEqual({
      inputTokens: 1000,
      cachedInputTokens: 100,
      cacheWriteTokens: 200,
      outputTokens: 100,
    });
    expect(f.guard.settle).toHaveBeenCalledWith({
      reservationId: "synthetic-reservation",
      estimatedUsd: expect.closeTo(0.000146, 10),
      outcome: "completed",
      actualTokens: 1100,
    });
    const serialized = String(f.fetcher.mock.calls[0]![1]!.body);
    const upper =
      ((Buffer.byteLength(serialized, "utf8") + 1024) * 0.125) / 1e6 +
      (request.maxOutputTokens * 0.5) / 1e6;
    expect(f.guard.reserve.mock.calls[0]![0].maximumUsd).toBeCloseTo(upper, 12);
    expect(f.fetcher).toHaveBeenCalledOnce();
  });
  it.each([
    { cached_tokens: 900, cache_write_tokens: 101 },
    { cached_tokens: 0, cache_write_tokens: 1001 },
    { cached_tokens: 0, cache_write_tokens: -1 },
    { cached_tokens: 0, cache_write_tokens: 0.5 },
  ])(
    "rejects invalid cache partitions before settlement: %j",
    async (details) => {
      const f = make(
        {
          usage: {
            input_tokens: 1000,
            input_tokens_details: details,
            output_tokens: 100,
          },
        },
        "2026-10-15",
      );
      await expect(
        f.provider.generate(request, new AbortController().signal),
      ).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
      expect(f.guard.settle).toHaveBeenCalledWith(
        expect.objectContaining({ estimatedUsd: null, outcome: "unknown" }),
      );
    },
  );
  it("unknown usage retains the larger cache-write reservation", async () => {
    const f = make({ usage: null }, "2026-10-15");
    await f.provider.generate(request, new AbortController().signal);
    expect(f.guard.settle).toHaveBeenCalledWith(
      expect.objectContaining({ estimatedUsd: null, outcome: "unknown" }),
    );
    expect(f.guard.reserve.mock.calls[0]![0].maximumUsd).toBeGreaterThan(0);
  });
  it("sends the strict Responses body to one fixed endpoint behind a spend guard", async () => {
    const f = make(),
      out = await f.provider.generate(request, new AbortController().signal);
    expect(out.status).toBe("completed");
    expect(out.requestId).toBe("req_transport");
    expect(out.usage).toEqual({
      inputTokens: 1000,
      cachedInputTokens: 100,
      outputTokens: 100,
    });
    const [url, init] = f.fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init?.redirect).toBe("error");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer FAKE_SERVER_CREDENTIAL_SENTINEL",
    );
    const body = JSON.parse(init!.body as string);
    expect(body.text.format.type).toBe("json_schema");
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.schema.type).toBe("object");
    expect(body.tools).toEqual([]);
    expect(body.tool_choice).toBe("none");
    expect(body.store).toBe(false);
    expect(body.stream).toBe(false);
    expect(body.truncation).toBe("disabled");
    expect(body).not.toHaveProperty("previous_response_id");
    expect(f.guard.reserve).toHaveBeenCalledOnce();
    expect(f.guard.settle).toHaveBeenCalledWith({
      reservationId: "synthetic-reservation",
      estimatedUsd: expect.closeTo(0.000141, 8),
      outcome: "completed",
      actualTokens: 1100,
    });
    expect(JSON.stringify(out)).not.toContain(
      "FAKE_SERVER_CREDENTIAL_SENTINEL",
    );
  });
  it("full neutral adapter parses fake HTTP, computes usage/cost and contains no provider payload", async () => {
    const t = make(),
      f = aiFixture();
    const out = await createEducationAdapter({
      input: f.input,
      provider: t.provider,
      config: t.config,
    }).run(f.request);
    expect(out.type).toBe("recommendations");
    expect(out.metadata.provider).toBe("openai");
    expect(out.metadata.estimatedCostUsd).toBeCloseTo(0.000141);
    expect(out.metadata.pricingVersion).toContain("2026-10-06");
    expect(JSON.stringify(out)).not.toContain("Authorization");
    expect(JSON.stringify(out)).not.toContain(
      "FAKE_SERVER_CREDENTIAL_SENTINEL",
    );
  });
  it.each([401, 403, 429, 500, 400, 302])(
    "normalizes HTTP %i without returning body",
    async (status) => {
      const f = make();
      f.fetcher.mockResolvedValue(
        new Response("PRIVATE_ERROR_SENTINEL", {
          status,
          headers: { "x-request-id": "req_failure" },
        }),
      );
      await expect(
        f.provider.generate(request, new AbortController().signal),
      ).rejects.toMatchObject({
        code:
          status === 429
            ? "RATE_LIMIT"
            : status === 401 || status === 403
              ? "AUTHENTICATION"
              : status >= 500
                ? "PROVIDER_UNAVAILABLE"
                : "INVALID_REQUEST",
        providerRequestId: "req_failure",
      });
      expect(f.guard.settle).toHaveBeenCalledWith({
        reservationId: "synthetic-reservation",
        estimatedUsd: null,
        outcome: "unknown",
        actualTokens: null,
      });
    },
  );
  it("preserves refusal usage without echoing refusal text", async () => {
    const f = make({
      output: [
        {
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "refusal", refusal: "PRIVATE_REFUSAL_SENTINEL" }],
        },
      ],
    });
    const out = await f.provider.generate(
      request,
      new AbortController().signal,
    );
    expect(out.status).toBe("refused");
    expect(out.text).toBeNull();
    expect(out.usage?.inputTokens).toBe(1000);
    expect(JSON.stringify(out)).not.toContain("PRIVATE_REFUSAL_SENTINEL");
  });
  it("reports incomplete status and usage without parsing a partial selection", async () => {
    const f = make({
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [],
    });
    expect(
      (await f.provider.generate(request, new AbortController().signal)).status,
    ).toBe("incomplete");
  });
  it.each([
    [
      "tool call",
      {
        output: [
          { type: "function_call", name: "shell", arguments: "private" },
        ],
      },
    ],
    ["missing output", { output: [] }],
    [
      "pending item",
      {
        output: [
          {
            type: "message",
            role: "assistant",
            status: "in_progress",
            content: [],
          },
        ],
      },
    ],
    ["wrong model", { model: "unapproved-model" }],
    [
      "invalid usage",
      {
        usage: {
          input_tokens: 1,
          input_tokens_details: { cached_tokens: 5 },
          output_tokens: 1,
        },
      },
    ],
    [
      "cache writes",
      {
        usage: {
          input_tokens: 10,
          input_tokens_details: { cached_tokens: 1, cache_write_tokens: 1 },
          output_tokens: 1,
        },
      },
    ],
  ])("rejects %s and settles unknown expenditure", async (_, patch) => {
    const f = make(patch);
    await expect(
      f.provider.generate(request, new AbortController().signal),
    ).rejects.toBeDefined();
    expect(f.guard.settle).toHaveBeenCalledWith({
      reservationId: "synthetic-reservation",
      estimatedUsd: null,
      outcome: "unknown",
      actualTokens: null,
    });
  });
  it("handles native reasoning items and records a returned model snapshot", async () => {
    const data = envelope();
    const f = make({
      model: "gpt-6-luna-2026-10-01",
      output: [
        { type: "reasoning", summary: [] },
        ...(data.output as unknown[]),
      ],
    });
    expect(
      (await f.provider.generate(request, new AbortController().signal)).model,
    ).toBe("gpt-6-luna-2026-10-01");
  });
  it("rejects malformed and oversized HTTP data", async () => {
    const f = make();
    f.fetcher.mockResolvedValue(new Response("not json"));
    await expect(
      f.provider.generate(request, new AbortController().signal),
    ).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
    f.fetcher.mockResolvedValue(new Response("x".repeat(65537)));
    await expect(
      f.provider.generate(request, new AbortController().signal),
    ).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
  });
  it.each(["approval", "guard", "key", "stale-price", "cost", "reservation"])(
    "does not send HTTP without %s gate",
    async (gate) => {
      const f = make();
      let config = f.config;
      let guard: SpendGuard | undefined = f.guard;
      let apiKey = "FAKE_SERVER_CREDENTIAL_SENTINEL";
      let asOf = "2026-10-06";
      if (gate === "approval")
        config = parseAiConfig({ provider: "openai", liveApproved: false });
      if (gate === "guard") guard = undefined;
      if (gate === "key") apiKey = "";
      if (gate === "stale-price") asOf = "2026-10-23";
      if (gate === "cost")
        config = parseAiConfig({
          provider: "openai",
          liveApproved: true,
          maxCostUsd: 0.0000001,
        });
      if (gate === "reservation") f.guard.reserve.mockResolvedValue(null);
      const provider = createOpenAIProvider({
        config,
        apiKey,
        guard,
        fetcher: f.fetcher,
        asOf,
      });
      await expect(
        provider.generate(request, new AbortController().signal),
      ).rejects.toBeDefined();
      expect(f.fetcher).not.toHaveBeenCalled();
    },
  );
  it("aborted calls never send and settle their reservation conservatively", async () => {
    const f = make(),
      controller = new AbortController();
    controller.abort();
    await expect(
      f.provider.generate(request, controller.signal),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(f.fetcher).not.toHaveBeenCalled();
    expect(f.guard.settle).toHaveBeenCalledWith({
      reservationId: "synthetic-reservation",
      estimatedUsd: null,
      outcome: "unknown",
      actualTokens: null,
    });
  });
  it("network failures are redacted and treated as unknown expenditure", async () => {
    const f = make();
    f.fetcher.mockRejectedValue(new Error("PRIVATE_NETWORK_SENTINEL"));
    await expect(
      f.provider.generate(request, new AbortController().signal),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      message: "PROVIDER_UNAVAILABLE",
    });
    expect(f.guard.settle).toHaveBeenCalledWith({
      reservationId: "synthetic-reservation",
      estimatedUsd: null,
      outcome: "unknown",
      actualTokens: null,
    });
  });
  it("unknown usage remains unknown, never becomes zero paid cost", async () => {
    const t = make({ usage: null }),
      f = aiFixture();
    const out = await createEducationAdapter({
      input: f.input,
      provider: t.provider,
      config: t.config,
    }).run(f.request);
    expect(out.metadata.usage).toBeNull();
    expect(out.metadata.estimatedCostUsd).toBeNull();
    expect(out.metadata.usageComplete).toBe(false);
  });
});
