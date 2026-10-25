// Legacy diagnostic fixture contract from step 3. The step 6 domain is in
// schema.ts/state.ts/engine.ts; this small mock contract stays compatible.
export type {
  ProfileState,
  ProfileValues,
  FieldKey,
  ProfileEvent,
} from "./schema.ts";
export type StudyLevel = "undergraduate" | "master" | "phd";
export type FieldState<T> =
  | { status: "unknown" }
  | { status: "user_stated" | "user_confirmed"; value: T }
  | { status: "conflicting"; values: readonly T[] };

export interface ProfileDraft {
  studyLevel: FieldState<StudyLevel>;
  goal: FieldState<string>;
}
