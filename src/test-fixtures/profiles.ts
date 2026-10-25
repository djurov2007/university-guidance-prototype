import type { ProfileDraft } from "@/features/profiles/types";

// Minimal visible input from docs/test-fixtures/SYNTHETIC_PROFILES.md v1.0.
// No hidden follow-up answers or invented programs are loaded.
export const syntheticProfile = {
  id: "SYN-UG-01",
  synthetic: true,
  adult: true,
  profile: {
    studyLevel: { status: "user_stated", value: "undergraduate" },
    goal: {
      status: "user_stated",
      value:
        "I want a practical bachelor's program in computing in Serbia for 2027.",
    },
  } satisfies ProfileDraft,
} as const;
