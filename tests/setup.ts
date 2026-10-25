import { beforeEach, vi } from "vitest";

// Next enforces this marker at build time. Unit tests exercise server logic;
// test:boundary separately proves that a real client build is rejected.
vi.mock("server-only", () => ({}));
// Regression tests cannot use a real credential or an external transport.
beforeEach(() => {
  vi.stubEnv("AI_PROVIDER", "mock");
  vi.stubEnv("AI_LIVE_APPROVED", "false");
  vi.stubEnv("OPENAI_API_KEY", "FAKE_SERVER_CREDENTIAL_SENTINEL");
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("External HTTP is disabled in offline tests."),
  );
});
