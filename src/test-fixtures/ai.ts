import { matchingFixture } from "./matching.ts";
import {
  buildAiContext,
  mockSelection,
} from "../server/ai/education-adapter.ts";
import type { AiRequest, ModelSelection } from "../features/ai/schema.ts";
import type { AiProvider, ProviderResponse } from "../server/ai/provider.ts";

export function aiFixture() {
  const input = matchingFixture();
  const request: AiRequest = {
    requestId: "synthetic-ai-request",
    profileRevision: input.profile.revision,
    task: "explain_recommendations",
    message: "Explain these study programme recommendations.",
  };
  const selection = mockSelection(buildAiContext(input), request.task);
  return { input, request, selection };
}
export function fakeAiProvider(
  selection: ModelSelection | string,
  patch: Partial<ProviderResponse> = {},
): AiProvider {
  return {
    kind: "mock",
    model: "fake-education-1",
    version: "fake-1",
    async generate() {
      return {
        status: "completed",
        text:
          typeof selection === "string" ? selection : JSON.stringify(selection),
        model: "fake-education-1",
        requestId: "req_synthetic",
        usage: { inputTokens: 100, cachedInputTokens: 10, outputTokens: 50 },
        ...patch,
      };
    },
  };
}
