import { mkdtemp, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cache = path.join(root, ".cache");
await mkdir(cache, { recursive: true });
const fixture = await mkdtemp(path.join(cache, "ai-boundary-"));
try {
  await mkdir(path.join(fixture, "app"));
  await mkdir(path.join(fixture, "app", "domain-code"));
  for (const directory of ["features", "server", "domain"])
    await cp(
      path.join(root, "src", directory),
      path.join(fixture, "app", "domain-code", directory),
      { recursive: true },
    );
  await writeFile(
    path.join(fixture, "package.json"),
    JSON.stringify({ name: "ai-boundary-check", private: true }),
  );
  await writeFile(
    path.join(fixture, "next.config.mjs"),
    "export default {};\n",
  );
  await writeFile(
    path.join(fixture, "app", "layout.js"),
    "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n",
  );
  await writeFile(
    path.join(fixture, "app", "page.js"),
    '"use client";\nimport {createOpenAIProvider} from "./domain-code/server/ai/openai-provider";\nexport default function Page(){ return <p>{typeof createOpenAIProvider}</p>; }\n',
  );
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules", "next", "dist", "bin", "next"),
      "build",
      fixture,
      "--turbopack",
    ],
    {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (
    result.error ||
    result.status === 0 ||
    !/server-only/i.test(output) ||
    !/Client Component|use client/i.test(output) ||
    !/openai-provider/.test(output)
  ) {
    await writeFile(path.join(cache, "ai-boundary-failure.txt"), output);
    throw new Error(
      "AI server boundary did not produce the expected client import rejection.",
    );
  }
  console.log(
    "PASS: Next.js rejected a Client Component importing an exact source copy of the OpenAI provider.",
  );
} finally {
  const relative = path.relative(cache, fixture);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !relative.startsWith("ai-boundary-")
  )
    throw new Error("Unsafe AI boundary cleanup path.");
  await rm(fixture, { recursive: true, force: true });
}
