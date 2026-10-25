import { describe, expect, it, vi } from "vitest";
import { createOpenAIProvider } from "@/server/ai/openai-provider";
import { createEducationAdapter } from "@/server/ai/education-adapter";
import { parseAiConfig } from "@/server/ai/config";
import {
  aiDiagnosticSchema,
  aiDiagnosticsSchema,
  emitDiagnostic,
  type DiagnosticReason,
} from "@/server/ai/diagnostics";
import {
  ProviderError,
  type ProviderRequest,
  type SpendGuard,
} from "@/server/ai/provider";
import { aiFixture, fakeAiProvider } from "@/test-fixtures/ai";

const SENTINEL = "PRIVATE_PROVIDER_PAYLOAD_9f72";
const request: ProviderRequest = {
  requestId: "diagnostics-fixture",
  contextJson: "{}",
  instructions: "Education study",
  maxOutputTokens: 1600,
  timeoutMs: 500,
  maxCostUsd: 0.01,
};
function envelope(patch: Record<string, unknown> = {}) {
  return {
    model: "gpt-6-luna",
    status: "completed",
    output: [
      {
        type: "message",
        status: "completed",
        role: "assistant",
        content: [
          { type: "output_text", text: JSON.stringify(aiFixture().selection) },
        ],
      },
    ],
    usage: {
      input_tokens: 1000,
      output_tokens: 100,
      input_tokens_details: { cached_tokens: 100 },
    },
    ...patch,
  };
}
const message = (content: unknown) => [
  { type: "message", status: "completed", role: "assistant", content },
];
function provider(response: Response) {
  const guard = {
    reserve: vi.fn<SpendGuard["reserve"]>().mockResolvedValue("hold"),
    settle: vi.fn<SpendGuard["settle"]>().mockResolvedValue(undefined),
  };
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);
  const config = parseAiConfig({ provider: "openai", liveApproved: true });
  const instance = createOpenAIProvider({
    config,
    guard,
    fetcher,
    apiKey: "FAKE_SERVER_CREDENTIAL_SENTINEL",
    asOf: "2026-10-11",
  });
  return { guard, fetcher, config, instance };
}

const failures: [string, () => Response, DiagnosticReason][] = [
  ["non-JSON", () => new Response(SENTINEL), "RESPONSE_NOT_JSON"],
  ["absent body", () => new Response(null), "RESPONSE_BODY_MISSING"],
  [
    "oversize declared body",
    () => new Response(SENTINEL, { headers: { "content-length": "999999" } }),
    "RESPONSE_TOO_LARGE",
  ],
  [
    "oversize streamed body",
    () => new Response(SENTINEL.repeat(3000)),
    "RESPONSE_TOO_LARGE",
  ],
  [
    "missing model",
    () => Response.json(envelope({ model: undefined })),
    "WIRE_SCHEMA_MISMATCH",
  ],
  [
    "unexpected response status",
    () => Response.json(envelope({ status: SENTINEL })),
    "WIRE_SCHEMA_MISMATCH",
  ],
  [
    "malformed nested content",
    () =>
      Response.json(
        envelope({
          output: message([
            { type: "output_text", text: { [SENTINEL]: SENTINEL } },
          ]),
        }),
      ),
    "WIRE_SCHEMA_MISMATCH",
  ],
  [
    "malformed usage",
    () => Response.json(envelope({ usage: { input_tokens: SENTINEL } })),
    "WIRE_SCHEMA_MISMATCH",
  ],
  [
    "wrong model",
    () => Response.json(envelope({ model: SENTINEL })),
    "MODEL_MISMATCH",
  ],
  [
    "cached tokens above input",
    () =>
      Response.json(
        envelope({
          usage: {
            input_tokens: 1,
            output_tokens: 1,
            input_tokens_details: { cached_tokens: 2 },
          },
        }),
      ),
    "USAGE_INCONSISTENT",
  ],
  [
    "cache writes",
    () =>
      Response.json(
        envelope({
          usage: {
            input_tokens: 10,
            output_tokens: 1,
            input_tokens_details: { cache_write_tokens: 1 },
          },
        }),
      ),
    "CACHE_WRITES_UNSUPPORTED",
  ],
  [
    "failed response",
    () =>
      Response.json(
        envelope({ status: "failed", error: { message: SENTINEL } }),
      ),
    "RESPONSE_STATUS_UNEXPECTED",
  ],
  [
    "unexpected tool item",
    () =>
      Response.json(
        envelope({ output: [{ type: "function_call", arguments: SENTINEL }] }),
      ),
    "OUTPUT_ITEM_UNEXPECTED",
  ],
  [
    "pending message",
    () =>
      Response.json(
        envelope({
          output: [
            {
              type: "message",
              role: "assistant",
              status: "in_progress",
              content: [],
            },
          ],
        }),
      ),
    "OUTPUT_ITEM_UNEXPECTED",
  ],
  [
    "unexpected content type",
    () =>
      Response.json(
        envelope({ output: message([{ type: SENTINEL, text: SENTINEL }]) }),
      ),
    "OUTPUT_CONTENT_UNEXPECTED",
  ],
  [
    "multiple texts",
    () =>
      Response.json(
        envelope({
          output: message([
            { type: "output_text", text: SENTINEL },
            { type: "output_text", text: SENTINEL },
          ]),
        }),
      ),
    "OUTPUT_TEXT_COUNT",
  ],
  [
    "no text",
    () => Response.json(envelope({ output: [] })),
    "OUTPUT_TEXT_COUNT",
  ],
  [
    "input usage above byte bound",
    () =>
      Response.json(
        envelope({ usage: { input_tokens: 1000000, output_tokens: 100 } }),
      ),
    "USAGE_EXCEEDS_RESERVATION",
  ],
  [
    "output usage above cap",
    () =>
      Response.json(
        envelope({ usage: { input_tokens: 1000, output_tokens: 1601 } }),
      ),
    "USAGE_EXCEEDS_RESERVATION",
  ],
];

describe("allowlisted response diagnostics, fake HTTP only", () => {
  it("classifies an aborted transport without making an HTTP call", async () => {
    const f = provider(Response.json(envelope()));
    const controller = new AbortController();
    controller.abort();
    await expect(
      f.instance.generate(request, controller.signal),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
      diagnostic: { reason: "TRANSPORT_TIMEOUT" },
    });
    expect(f.fetcher).not.toHaveBeenCalled();
    expect(f.guard.settle.mock.calls[0]![0]).toMatchObject({
      outcome: "unknown",
      estimatedUsd: null,
    });
  });
  it.each(failures)(
    "distinguishes %s without retaining payload",
    async (_name, response, reason) => {
      const raw = response();
      raw.headers.set("x-request-id", "req_diagnostic");
      const f = provider(raw);
      let failure: ProviderError | undefined;
      try {
        await f.instance.generate(request, new AbortController().signal);
      } catch (e) {
        expect(e).toBeInstanceOf(ProviderError);
        failure = e as ProviderError;
      }
      expect(failure).toBeDefined();
      expect(failure!.diagnostic).toMatchObject({ reason, httpStatus: 200 });
      expect(aiDiagnosticSchema.safeParse(failure!.diagnostic).success).toBe(
        true,
      );
      expect(failure!.providerRequestId).toBe("req_diagnostic");
      expect(JSON.stringify(failure)).not.toContain(SENTINEL);
      expect(f.guard.settle).toHaveBeenCalledOnce();
      expect(f.guard.settle.mock.calls[0]![0]).toMatchObject({
        outcome: "unknown",
        estimatedUsd: null,
        actualTokens: null,
      });
      expect(f.fetcher).toHaveBeenCalledOnce();
    },
  );
  it("wire errors only expose fixed top-level field names", async () => {
    const f = provider(
      Response.json(
        envelope({ usage: { [SENTINEL]: SENTINEL }, status: SENTINEL }),
      ),
    );
    await expect(
      f.instance.generate(request, new AbortController().signal),
    ).rejects.toMatchObject({
      diagnostic: {
        reason: "WIRE_SCHEMA_MISMATCH",
        invalidFields: expect.arrayContaining(["usage", "status"]),
      },
    });
  });
  it.each([401, 403, 429, 500])(
    "records actual HTTP %i without raw headers/error body",
    async (status) => {
      const f = provider(
        new Response(SENTINEL, {
          status,
          headers: { "x-request-id": "req_diagnostic", "set-cookie": SENTINEL },
        }),
      );
      await expect(
        f.instance.generate(request, new AbortController().signal),
      ).rejects.toMatchObject({
        diagnostic: { reason: "HTTP_REJECTED", httpStatus: status },
      });
    },
  );
  it("records a redacted network failure", async () => {
    const f = provider(Response.json(envelope()));
    f.fetcher.mockRejectedValue(new Error(SENTINEL));
    await expect(
      f.instance.generate(request, new AbortController().signal),
    ).rejects.toMatchObject({
      message: "PROVIDER_UNAVAILABLE",
      diagnostic: { reason: "NETWORK_FAILURE" },
    });
  });
  it("valid responses are unchanged and a response at the byte limit remains valid", async () => {
    const text = JSON.stringify(envelope());
    const f = provider(
      new Response(text + " ".repeat(65536 - Buffer.byteLength(text))),
    );
    const actual = await f.instance.generate(
      request,
      new AbortController().signal,
    );
    expect(actual.status).toBe("completed");
    expect(actual.usage?.inputTokens).toBe(1000);
    expect(actual).not.toHaveProperty("diagnostic");
    expect(f.guard.settle.mock.calls[0]![0]).toMatchObject({
      outcome: "completed",
      actualTokens: 1100,
    });
  });
});

describe("adapter diagnostics never enter the public AI response", () => {
  it.each([
    "provider-schema",
    "empty-text",
    "selection-json",
    "selection-schema",
    "grounding",
    "refusal",
    "incomplete",
  ])("distinguishes %s", async (stage) => {
    const f = aiFixture();
    const onDiagnostic = vi.fn();
    let p = fakeAiProvider(f.selection);
    if (stage === "provider-schema")
      p = fakeAiProvider(f.selection, {
        usage: { inputTokens: -1, cachedInputTokens: 0, outputTokens: 0 },
      });
    if (stage === "empty-text") p = fakeAiProvider("");
    if (stage === "selection-json") p = fakeAiProvider(SENTINEL);
    if (stage === "selection-schema")
      p = fakeAiProvider(JSON.stringify({ [SENTINEL]: SENTINEL }));
    if (stage === "grounding") {
      const s = structuredClone(f.selection);
      s.selections[0]!.sourceIds = [SENTINEL];
      p = fakeAiProvider(s);
    }
    if (stage === "refusal")
      p = fakeAiProvider(f.selection, { status: "refused", text: null });
    if (stage === "incomplete")
      p = fakeAiProvider(f.selection, { status: "incomplete", text: null });
    const result = await createEducationAdapter({
      input: f.input,
      provider: p,
      onDiagnostic,
    }).run(f.request);
    const reasons = {
      "provider-schema": "PROVIDER_RESPONSE_SCHEMA",
      "empty-text": "SELECTION_TEXT_BOUNDS",
      "selection-json": "SELECTION_NOT_JSON",
      "selection-schema": "SELECTION_SCHEMA_MISMATCH",
      grounding: "SEMANTIC_SELECTION_REJECTED",
      refusal: "MODEL_REFUSAL",
      incomplete: "RESPONSE_INCOMPLETE",
    };
    expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
      reason: reasons[stage as keyof typeof reasons],
      ...(stage === "grounding" ? { rule: "SOURCE_NOT_ALLOWED" } : {}),
    });
    expect(result.type).toBe("error");
    expect(result.proposals).toEqual([]);
    expect(result.metadata).not.toHaveProperty("diagnostics");
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
  });
  it("carries a wire diagnosis through the full adapter without changing public error", async () => {
    const f = aiFixture();
    const p = provider(Response.json(envelope({ model: SENTINEL })));
    const onDiagnostic = vi.fn();
    const result = await createEducationAdapter({
      input: f.input,
      provider: p.instance,
      config: p.config,
      onDiagnostic,
    }).run(f.request);
    expect(result.error?.code).toBe("INVALID_OUTPUT");
    expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
      reason: "MODEL_MISMATCH",
      httpStatus: 200,
    });
    expect(JSON.stringify(result)).not.toContain("MODEL_MISMATCH");
  });
  it("a failing diagnostic observer cannot alter rejection or successful output", async () => {
    const f = aiFixture();
    const onDiagnostic = vi.fn(() => {
      throw new Error(SENTINEL);
    });
    const bad = await createEducationAdapter({
      input: f.input,
      provider: fakeAiProvider(SENTINEL),
      onDiagnostic,
    }).run(f.request);
    expect(bad.error?.code).toBe("INVALID_OUTPUT");
    const good = await createEducationAdapter({
      input: f.input,
      provider: fakeAiProvider(f.selection),
      onDiagnostic,
    }).run(f.request);
    expect(good.type).toBe("recommendations");
  });
  it("rejects diagnostic injection, raw payload, arbitrary fields and unbounded lists", () => {
    for (const data of [
      { reason: SENTINEL },
      { reason: "WIRE_SCHEMA_MISMATCH", invalidFields: [SENTINEL] },
      { reason: "MODEL_MISMATCH", body: SENTINEL },
      { reason: "MODEL_MISMATCH", httpStatus: 999 },
      { reason: "RESPONSE_TOO_LARGE", responseBytes: 65538 },
    ]) {
      expect(aiDiagnosticSchema.safeParse(data).success).toBe(false);
      const sink = vi.fn();
      emitDiagnostic(sink, data as never);
      expect(sink).not.toHaveBeenCalled();
      const error = new ProviderError(
        "INVALID_OUTPUT",
        false,
        null,
        data as never,
      );
      expect(error.diagnostic).toBeNull();
    }
    expect(
      aiDiagnosticsSchema.safeParse(
        Array.from({ length: 5 }, () => ({ reason: "MODEL_MISMATCH" })),
      ).success,
    ).toBe(false);
  });
});
