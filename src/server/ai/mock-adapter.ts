import "server-only";
import type { AiAdapter } from "@/features/ai/contracts";
import { diagnosticDataSchema } from "@/features/ai/contracts";
import { syntheticProfile } from "@/test-fixtures/profiles";
import { mockCatalog } from "@/server/catalog/mock-repository";

export const mockAiAdapter: AiAdapter = {
  async diagnose(request) {
    const entries = await mockCatalog.list();
    const data = diagnosticDataSchema.parse({
      mode: "mock",
      fixtureId: request.fixtureId,
      synthetic: syntheticProfile.synthetic,
      catalogCount: entries.length,
      message: "Mock adapter is ready. No external AI or database was used.",
    });
    return { ok: true, data };
  },
};
