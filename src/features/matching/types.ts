import type { CatalogEntry } from "@/features/catalog/types";
import type { ProfileDraft } from "@/features/profiles/types";
import type { Result } from "@/domain/result";

// Legacy mock port from step 3. Step 7 uses the validated matching contract.
export type {
  MatchingInput,
  MatchingCatalog,
  MatchingProgram,
  MatchingOutput,
} from "./schema";
export interface MatchingEngine {
  match(
    profile: ProfileDraft,
    catalog: readonly CatalogEntry[],
  ): Result<readonly string[]>;
}
