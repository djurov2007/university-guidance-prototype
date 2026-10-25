import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cache = path.join(root, ".cache");
await mkdir(cache, { recursive: true });
const fixture = await mkdtemp(path.join(cache, "server-boundary-"));

try {
  await mkdir(path.join(fixture, "app"));
  await writeFile(
    path.join(fixture, "package.json"),
    JSON.stringify({ name: "server-boundary-check", private: true }),
  );
  await writeFile(
    path.join(fixture, "next.config.mjs"),
    "export default {};\n",
  );
  await writeFile(
    path.join(fixture, "app", "layout.js"),
    "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n",
  );
  // Exact source copies keep Next's module inside this fixture's App Router
  // compilation context, without changing the real application's source.
  await mkdir(path.join(fixture, "app", "private"));
  for (const filename of ["env.ts", "schema.ts"]) {
    await writeFile(
      path.join(fixture, "app", "private", filename),
      await readFile(path.join(root, "src", "server", "config", filename)),
    );
  }
  await writeFile(
    path.join(fixture, "app", "page.js"),
    '"use client";\nimport {getServerConfig} from "./private/env";\nexport default function Page() { return <p>{getServerConfig().mode}</p>; }\n',
  );
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules", "next", "dist", "bin", "next"),
      "build",
      fixture,
      "--webpack",
    ],
    {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", APP_MODE: "mock" },
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (
    result.error ||
    result.status === 0 ||
    !/server-only/i.test(output) ||
    !/Client Component|use client/i.test(output)
  ) {
    console.error(output);
    throw new Error(
      "The boundary check did not produce the expected client import rejection.",
    );
  }
  console.log(
    "PASS: Next.js rejected a Client Component importing an exact source copy of the server configuration.",
  );
} finally {
  // Delete only this newly created owned fixture, inside the verified cache path.
  const relative = path.relative(cache, fixture);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    !relative.startsWith("server-boundary-")
  ) {
    throw new Error("Unsafe fixture cleanup path.");
  }
  await rm(fixture, { recursive: true, force: true });
}
