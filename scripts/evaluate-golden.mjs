import { mkdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import {
  goldenCases,
  GOLDEN_VERSION,
} from "../src/test-fixtures/golden-set.ts";
// Native Node requires Next's file extension; the app and Vitest use bundler resolution.
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier === "next/server" ? "next/server.js" : specifier,
      context,
    );
  },
});
const { runGoldenSet } = await import("../src/test-fixtures/golden-runner.ts");
mkdirSync(".cache/testing", { recursive: true });
const result = await runGoldenSet();
writeFileSync(
  ".cache/testing/golden-result.json",
  JSON.stringify(result, null, 2) + "\n",
);
writeFileSync(
  ".cache/testing/golden-manifest.json",
  JSON.stringify({ version: GOLDEN_VERSION, cases: goldenCases }, null, 2) +
    "\n",
);
console.log(
  JSON.stringify({
    version: result.version,
    cases: result.caseCount,
    executions: result.executions,
    passed: result.passed,
    failed: result.failed,
    file: ".cache/testing/golden-result.json",
  }),
);
if (result.failed) {
  console.log(JSON.stringify(result.results.filter((r) => !r.passed)));
  process.exitCode = 1;
}
