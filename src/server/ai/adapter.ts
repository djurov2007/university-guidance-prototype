import "server-only";
import type { AiAdapter } from "@/features/ai/contracts";
import { getServerConfig } from "@/server/config/env";
import { mockAiAdapter } from "./mock-adapter";

export function getAiAdapter(): AiAdapter {
  getServerConfig(); // Unsupported live modes fail closed; never silently fall back.
  return mockAiAdapter;
}
