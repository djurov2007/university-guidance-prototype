import "server-only";
import type { CatalogRepository } from "@/features/catalog/types";

export const mockCatalog: CatalogRepository = {
  async list() {
    return [];
  },
};
