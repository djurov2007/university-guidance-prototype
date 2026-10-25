// Legacy diagnostic port stays independent of the real staging/published catalog.
export type {
  CatalogSnapshot,
  CatalogFact,
  FactValue,
  VerificationStatus,
} from "./schema";
export interface CatalogEntry {
  id: string;
  studyLevel: "undergraduate" | "master" | "phd";
}

export interface CatalogRepository {
  list(): Promise<readonly CatalogEntry[]>;
}
