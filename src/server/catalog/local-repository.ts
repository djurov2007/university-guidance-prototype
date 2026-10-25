import "server-only";
import staging from "../../../data/catalog/staging/catalog.v1.json" with { type: "json" };
import published from "../../../data/catalog/published/catalog.v1.json" with { type: "json" };
import { validateCatalog } from "./validation.ts";

// Explicit preview access; staging is never substituted for an empty publication.
export function readLocalCatalog(
  channel: "staging" | "published",
  asOf: string,
) {
  const result = validateCatalog(
    channel === "staging" ? staging : published,
    asOf,
  );
  if (!result.ok || !result.catalog || result.catalog.channel !== channel) {
    throw new Error("Local catalog failed integrity/publication checks");
  }
  return result;
}
