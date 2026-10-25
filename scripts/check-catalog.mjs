import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { validateCatalog } from "../src/server/catalog/validation.ts";

// Read-only offline checker. No fetch, import, database write or promotion.
const args = process.argv.slice(2);
const dateIndex = args.indexOf("--as-of");
const todayInBelgrade = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .filter(({ type }) => ["year", "month", "day"].includes(type))
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const asOf = dateIndex >= 0 ? args[dateIndex + 1] : todayInBelgrade();
const fileIndex = args.indexOf("--file");
const files =
  fileIndex >= 0
    ? [args[fileIndex + 1]]
    : [
        "data/catalog/staging/catalog.v1.json",
        "data/catalog/published/catalog.v1.json",
      ];
const root = fileURLToPath(new URL("../", import.meta.url));
try {
  for (const file of files) {
    if (!file || !asOf) throw new Error("Missing file/date argument");
    const result = validateCatalog(
      JSON.parse(await readFile(resolve(root, file), "utf8")),
      asOf,
    );
    const c = result.catalog;
    console.log(
      JSON.stringify(
        {
          file,
          asOf,
          ok: result.ok,
          channel: c?.channel,
          programs: c?.programs.length,
          sources: c?.sources.length,
          facts: c?.facts.length,
          warnings: result.warnings.length,
          issues: result.issues,
        },
        null,
        2,
      ),
    );
    if (!result.ok) process.exitCode = 1;
  }
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Catalog validation failed",
  );
  process.exitCode = 1;
}
