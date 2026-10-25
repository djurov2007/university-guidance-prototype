import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}
const client = files(path.join(root, ".next/static")).filter((f) =>
  /\.(?:js|map|json|css)$/.test(f),
);
if (!client.length)
  throw new Error("Build the production client before scanning.");
const terms = [
  "FAKE_QA_SERVER_KEY_20261011",
  "FAKE_SERVER_CREDENTIAL_SENTINEL",
  "TEST_ONLY_PRIVATE_SENTINEL",
  "OPENAI_API_KEY",
  "createOpenAIProvider",
  "node:sqlite",
];
const hits = [];
for (const file of client) {
  const text = readFileSync(file, "utf8");
  for (const term of terms)
    if (text.includes(term))
      hits.push({ file: path.relative(root, file), label: term });
  if (/sk-(?:proj-)?[A-Za-z0-9_-]{24,}/.test(text))
    hits.push({
      file: path.relative(root, file),
      label: "credential-shaped value",
    });
}
const traces = files(path.join(root, ".next/server")).filter((f) =>
  f.endsWith(".nft.json"),
);
if (!traces.length)
  throw new Error("Production server tracing inventories are missing.");
const unsafeTrace = [];
for (const trace of traces) {
  for (const file of JSON.parse(readFileSync(trace, "utf8")).files) {
    const absolute = path.resolve(path.dirname(trace), file);
    const relative = path.relative(root, absolute).replaceAll("\\", "/");
    if (
      /(?:^|\/)(?:\.local|\.cache)(?:\/|$)/.test(relative) ||
      /(?:^|\/)\.env(?!\.example$)/.test(relative)
    )
      unsafeTrace.push({ trace: path.relative(root, trace), file: relative });
  }
}
const report = {
  clientFiles: client.length,
  tracingInventories: traces.length,
  hits,
  unsafeTrace,
  pass: !hits.length && !unsafeTrace.length,
};
mkdirSync(".cache/testing", { recursive: true });
writeFileSync(
  ".cache/testing/client-bundle-scan.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
if (!report.pass) process.exitCode = 1;
