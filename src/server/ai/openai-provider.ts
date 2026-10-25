import "server-only";
import { z } from "zod";
import { tokenUsageSchema } from "../../features/ai/schema.ts";
import { parseAiConfig, type AiConfig } from "./config.ts";
import { currentPricing, estimateCost } from "./pricing.ts";
import { diagnosticFieldSchema } from "./diagnostics.ts";
import { selectionSchemaForTurn } from "./response-schema.ts";
import {
  ProviderError,
  providerResponseSchema,
  type AiProvider,
  type ProviderRequest,
  type ProviderResponse,
  type SpendGuard,
} from "./provider.ts";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const RESPONSE_BYTE_LIMIT = 65536;
const wireSchema = z
  .object({
    model: z.string().min(1).max(120),
    status: z.enum([
      "completed",
      "incomplete",
      "failed",
      "in_progress",
      "queued",
      "cancelled",
    ]),
    output: z
      .array(
        z
          .object({
            type: z.string(),
            status: z.string().optional(),
            role: z.string().optional(),
            content: z
              .array(
                z
                  .object({
                    type: z.string(),
                    text: z.string().optional(),
                    refusal: z.string().optional(),
                  })
                  .passthrough(),
              )
              .optional(),
          })
          .passthrough(),
      )
      .max(16),
    usage: z
      .object({
        input_tokens: z.number().int().nonnegative().max(10000000),
        output_tokens: z.number().int().nonnegative().max(10000000),
        input_tokens_details: z
          .object({
            cached_tokens: z.number().int().nonnegative().default(0),
            cache_write_tokens: z.number().int().nonnegative().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();
async function readBounded(
  response: Response,
  signal: AbortSignal,
  requestId: string | null,
): Promise<unknown> {
  if (Number(response.headers.get("content-length")) > RESPONSE_BYTE_LIMIT)
    throw new ProviderError("INVALID_OUTPUT", false, requestId, {
      reason: "RESPONSE_TOO_LARGE",
      responseBytes: 65537,
    });
  if (!response.body)
    throw new ProviderError("INCOMPLETE_RESPONSE", false, requestId, {
      reason: "RESPONSE_BODY_MISSING",
    });
  const reader = response.body.getReader();
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      if (signal.aborted)
        throw new ProviderError("TIMEOUT", false, requestId, {
          reason: "TRANSPORT_TIMEOUT",
        });
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > RESPONSE_BYTE_LIMIT)
        throw new ProviderError("INVALID_OUTPUT", false, requestId, {
          reason: "RESPONSE_TOO_LARGE",
          responseBytes: 65537,
        });
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    try {
      return JSON.parse(text);
    } catch {
      throw new ProviderError("INVALID_OUTPUT", false, requestId, {
        reason: "RESPONSE_NOT_JSON",
        responseBytes: total,
      });
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}
function parseWire(
  raw: unknown,
  requestId: string | null,
  model: string,
  cacheWritesPriced: boolean,
): ProviderResponse {
  const parsed = wireSchema.safeParse(raw);
  if (!parsed.success) {
    const invalidFields = [
      ...new Set(
        parsed.error.issues.map((issue) => {
          const field = diagnosticFieldSchema.safeParse(issue.path[0]);
          return field.success ? field.data : ("other" as const);
        }),
      ),
    ];
    throw new ProviderError("INVALID_OUTPUT", false, requestId, {
      reason: "WIRE_SCHEMA_MISMATCH",
      invalidFields,
    });
  }
  const data = parsed.data;
  // Preserve the returned snapshot/version; no automatic unapproved model substitution.
  if (data.model !== model && !data.model.startsWith(`${model}-`))
    throw new ProviderError("INVALID_OUTPUT", false, requestId, {
      reason: "MODEL_MISMATCH",
    });
  const usageParsed = data.usage
    ? tokenUsageSchema.safeParse({
        inputTokens: data.usage.input_tokens,
        cachedInputTokens: data.usage.input_tokens_details?.cached_tokens ?? 0,
        ...(data.usage.input_tokens_details?.cache_write_tokens === undefined
          ? {}
          : {
              cacheWriteTokens:
                data.usage.input_tokens_details.cache_write_tokens,
            }),
        outputTokens: data.usage.output_tokens,
      })
    : null;
  if (usageParsed && !usageParsed.success)
    throw new ProviderError("INVALID_OUTPUT", false, requestId, {
      reason: "USAGE_INCONSISTENT",
    });
  const usage = usageParsed?.success ? usageParsed.data : null;
  if (
    (data.usage?.input_tokens_details?.cache_write_tokens ?? 0) > 0 &&
    !cacheWritesPriced
  )
    throw new ProviderError("INVALID_OUTPUT", false, requestId, {
      reason: "CACHE_WRITES_UNSUPPORTED",
    });
  if (data.status === "incomplete")
    return providerResponseSchema.parse({
      status: "incomplete",
      text: null,
      model: data.model,
      requestId,
      usage,
    });
  if (data.status !== "completed")
    throw new ProviderError("PROVIDER_UNAVAILABLE", false, requestId, {
      reason: "RESPONSE_STATUS_UNEXPECTED",
    });
  const texts: string[] = [];
  let refused = false;
  for (const item of data.output) {
    if (item.type === "reasoning") continue;
    if (
      item.type !== "message" ||
      item.role !== "assistant" ||
      item.status !== "completed" ||
      !item.content
    )
      throw new ProviderError("INVALID_OUTPUT", false, requestId, {
        reason: "OUTPUT_ITEM_UNEXPECTED",
      });
    for (const content of item.content) {
      if (content.type === "refusal") {
        refused = true;
        continue;
      }
      if (content.type !== "output_text" || typeof content.text !== "string")
        throw new ProviderError("INVALID_OUTPUT", false, requestId, {
          reason: "OUTPUT_CONTENT_UNEXPECTED",
        });
      texts.push(content.text);
    }
  }
  if (!refused && texts.length !== 1)
    throw new ProviderError("INCOMPLETE_RESPONSE", false, requestId, {
      reason: "OUTPUT_TEXT_COUNT",
    });
  return providerResponseSchema.parse({
    status: refused ? "refused" : "completed",
    text: refused ? null : texts[0],
    model: data.model,
    requestId,
    usage,
  });
}
export function createOpenAIProvider(options: {
  config: AiConfig;
  apiKey?: string | undefined;
  guard?: SpendGuard | undefined;
  fetcher?: typeof fetch;
  asOf?: string;
}): AiProvider {
  const config = parseAiConfig(options.config);
  // Key stays in this server-only closure; it is never part of provider metadata.
  return {
    kind: "openai",
    model: config.model,
    version: "responses-http-v1",
    async generate(request: ProviderRequest, signal: AbortSignal) {
      if (!config.liveApproved || !options.guard)
        throw new ProviderError("LIVE_DISABLED");
      if (
        !options.apiKey?.trim() ||
        options.apiKey === "PASTE_YOUR_OPENAI_API_KEY_HERE" ||
        /[\r\n]/.test(options.apiKey)
      )
        throw new ProviderError("CONFIGURATION_ERROR");
      const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
      const pricing = currentPricing(config.model, asOf);
      if (!pricing) throw new ProviderError("CONFIGURATION_ERROR");
      const body = {
        model: config.model,
        instructions: request.instructions,
        input: [
          {
            role: "user",
            content: [{ type: "input_text", text: request.contextJson }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "education_selection",
            strict: true,
            schema: selectionSchemaForTurn(request.contextJson),
          },
        },
        store: false,
        stream: false,
        background: false,
        tools: [],
        tool_choice: "none",
        parallel_tool_calls: false,
        truncation: "disabled",
        service_tier: "default",
        reasoning: { effort: config.model === "gpt-6-luna" ? "none" : "low" },
        max_output_tokens: request.maxOutputTokens,
      };
      const serialized = JSON.stringify(body);
      const bytes = Buffer.byteLength(serialized, "utf8");
      if (bytes > 128000) throw new ProviderError("INVALID_REQUEST");
      // Deliberately conservative UTF-8 byte bound plus framing allowance; not a tokenizer estimate.
      const maximumUsd = estimateCost(
        {
          inputTokens: bytes + 1024,
          cachedInputTokens: 0,
          cacheWriteTokens:
            pricing.cacheWritePerMillion === undefined ? 0 : bytes + 1024,
          outputTokens: request.maxOutputTokens,
        },
        pricing,
      );
      if (maximumUsd > Math.min(request.maxCostUsd, config.maxCostUsd))
        throw new ProviderError("BUDGET_EXCEEDED");
      const reservationId = await options.guard.reserve({
        requestId: request.requestId,
        maximumUsd,
        maximumTokens: bytes + 1024 + request.maxOutputTokens,
      });
      if (!reservationId) throw new ProviderError("BUDGET_EXCEEDED");
      let parsed: ProviderResponse | null = null;
      let httpStatus: number | undefined;
      let providerRequestId: string | null = null;
      try {
        if (signal.aborted)
          throw new ProviderError("TIMEOUT", false, null, {
            reason: "TRANSPORT_TIMEOUT",
          });
        const response = await (options.fetcher ?? fetch)(OPENAI_ENDPOINT, {
          method: "POST",
          redirect: "error",
          signal,
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
            "X-Client-Request-Id": request.requestId,
          },
          body: serialized,
        });
        const rid = response.headers.get("x-request-id");
        httpStatus = response.status;
        providerRequestId = rid;
        if (!response.ok) {
          await response.body?.cancel().catch(() => {});
          // No raw body/provider messages, headers with secrets or Retry-After echo.
          if (response.status === 429)
            throw new ProviderError("RATE_LIMIT", true, rid, {
              reason: "HTTP_REJECTED",
              httpStatus: response.status,
            });
          if (response.status === 401 || response.status === 403)
            throw new ProviderError("AUTHENTICATION", false, rid, {
              reason: "HTTP_REJECTED",
              httpStatus: response.status,
            });
          throw new ProviderError(
            response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "INVALID_REQUEST",
            false,
            rid,
            { reason: "HTTP_REJECTED", httpStatus: response.status },
          );
        }
        parsed = parseWire(
          await readBounded(response, signal, rid),
          rid,
          config.model,
          pricing.cacheWritePerMillion !== undefined,
        );
        if (
          parsed.usage &&
          (parsed.usage.inputTokens > bytes + 1024 ||
            parsed.usage.outputTokens > request.maxOutputTokens)
        ) {
          parsed = null;
          throw new ProviderError("INVALID_OUTPUT", false, rid, {
            reason: "USAGE_EXCEEDS_RESERVATION",
          });
        }
        return parsed;
      } catch (e) {
        if (e instanceof ProviderError) {
          if (
            e.diagnostic &&
            httpStatus !== undefined &&
            httpStatus >= 100 &&
            httpStatus <= 599
          )
            throw new ProviderError(e.code, e.retryable, e.providerRequestId, {
              ...e.diagnostic,
              httpStatus,
            });
          throw e;
        }
        throw new ProviderError(
          signal.aborted ? "TIMEOUT" : "PROVIDER_UNAVAILABLE",
          false,
          providerRequestId,
          { reason: signal.aborted ? "TRANSPORT_TIMEOUT" : "NETWORK_FAILURE" },
        );
      } finally {
        await options.guard.settle({
          reservationId,
          estimatedUsd: parsed?.usage
            ? estimateCost(parsed.usage, pricing)
            : null,
          outcome: parsed?.usage ? "completed" : "unknown",
          actualTokens: parsed?.usage
            ? parsed.usage.inputTokens + parsed.usage.outputTokens
            : null,
        });
      }
    },
  };
}
