import "server-only";
import { mockSelection, type buildAiContext } from "./education-adapter.ts";
import type { AiProvider } from "./provider.ts";

// A deterministic selection double, not an NLP extractor or a live-model quality claim.
export function createEducationMock(
  context: ReturnType<typeof buildAiContext>,
): AiProvider {
  return {
    kind: "mock",
    model: "synthetic-selector-1",
    version: "education-mock-1",
    async generate(request) {
      const task = (JSON.parse(request.contextJson) as { task: string }).task;
      return {
        status: "completed",
        text: JSON.stringify(mockSelection(context, task)),
        model: "synthetic-selector-1",
        requestId: null,
        usage: null,
      };
    },
  };
}
