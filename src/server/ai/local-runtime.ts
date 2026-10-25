import "server-only";
import type { MatchingInput } from "../../features/matching/schema.ts";
import type { Scenario } from "../../features/conversation/schema.ts";
import { readAiConfig } from "./config.ts";
import { buildAiContext } from "./education-adapter.ts";
import { createEducationMock } from "./education-mock.ts";
import { createOpenAIProvider } from "./openai-provider.ts";
import { liveEvaluationPolicy } from "../security/control.ts";
import { ProviderError, type AiProvider, type SpendGuard } from "./provider.ts";

export function localAiPolicy() {
  const config = readAiConfig();
  return {
    externalAi: config.provider === "openai",
    liveAiEnabled:
      config.provider === "openai" &&
      config.liveApproved &&
      config.model === liveEvaluationPolicy.model,
    noticeVersion:
      config.provider === "openai"
        ? "synthetic-openai-1"
        : "synthetic-privacy-1",
  };
}

export function createLocalConversationProvider(
  input: MatchingInput,
  scenario: Scenario,
  guard?: SpendGuard,
): AiProvider {
  const config = readAiConfig();
  // Deliberate failure fixtures never use paid AI. The published catalogue has
  // its own human-review gate before this runtime can expose it.
  if (scenario === "provider_unavailable")
    return {
      kind: "mock",
      model: "synthetic-unavailable",
      version: "local-1",
      async generate() {
        throw new ProviderError("PROVIDER_UNAVAILABLE");
      },
    };
  if (config.provider === "mock")
    return createEducationMock(buildAiContext(input));
  return createOpenAIProvider({
    config: {
      ...config,
      liveApproved:
        config.liveApproved && config.model === liveEvaluationPolicy.model,
      maxRetries: 0,
    },
    apiKey: process.env.OPENAI_API_KEY,
    guard,
  });
}
