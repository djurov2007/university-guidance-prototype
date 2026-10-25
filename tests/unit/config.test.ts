import { describe, expect, it } from "vitest";
import { parseServerConfig } from "@/server/config/schema";

describe("server configuration", () => {
  it("starts in mock mode without keys or a database", () => {
    expect(parseServerConfig({})).toEqual({ mode: "mock" });
  });

  it("rejects an unsupported live mode without repeating its value", () => {
    const untrusted = "PRIVATE_TEST_SENTINEL";
    expect(() => parseServerConfig({ APP_MODE: untrusted })).toThrow(
      "APP_MODE must be mock",
    );
    expect(() => parseServerConfig({ APP_MODE: untrusted })).not.toThrow(
      untrusted,
    );
  });
});
