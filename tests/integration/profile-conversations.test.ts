import { describe, expect, it } from "vitest";
import {
  profileSchema,
  trustedValue,
} from "../../src/features/profiles/schema.ts";
import {
  profileConversations,
  replayConversation,
} from "../../src/test-fixtures/profile-conversations.ts";

describe("ten executable synthetic conversations", () => {
  it.each(profileConversations)("$id: $title", (fixture) => {
    const result = replayConversation(fixture),
      final = result.trace.at(-1)!.turn;
    expect(final.status).toBe(fixture.expected);
    expect(profileSchema.safeParse(result.state).success).toBe(true);
    for (const item of result.trace)
      expect(item.turn.questions.length).toBeLessThanOrEqual(2);
    if (fixture.id === "PROFILE-DOCUMENT-UNCONFIRMED") {
      expect(trustedValue(result.state, "budgetAmount")).toBe(10000);
      expect(final.questions[0]?.id).toBe("confirm-budgetAmount");
    }
    if (fixture.id === "PROFILE-MISSING-LANGUAGE")
      expect(final.questions.map((q) => q.field)).toContain(
        "teachingLanguages",
      );
    if (fixture.id === "PROFILE-PREFERENCE-CHANGE")
      expect(
        result.state.history.some((h) =>
          h.changes.some((c) => c.field === "preferredCountries"),
        ),
      ).toBe(true);
  });
});
