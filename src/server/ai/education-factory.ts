import "server-only";
import type { MatchingInput } from "../../features/matching/schema.ts";
import type { SpendGuard } from "./provider.ts";
import { readAiConfig } from "./config.ts";
import { buildAiContext, createEducationAdapter } from "./education-adapter.ts";
import { createEducationMock } from "./education-mock.ts";
import { createOpenAIProvider } from "./openai-provider.ts";

// Internal trusted server caller only. No public AI route until UI/session/quota steps.
export function getEducationAdapter(input: MatchingInput, guard?: SpendGuard) {
  const config = readAiConfig();
  const provider =
    config.provider === "mock"
      ? createEducationMock(buildAiContext(input))
      : createOpenAIProvider({
          config,
          apiKey: process.env.OPENAI_API_KEY,
          guard,
        });
  return createEducationAdapter({ input, config, provider });
}
