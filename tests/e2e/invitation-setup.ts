import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
export default function setup() {
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      ["--conditions=react-server", "scripts/invitations.mjs", "create", "100"],
      { encoding: "utf8", env: process.env },
    ),
  );
  process.env.TEST_INVITE_CODE = /^Code: (.+)$/m.exec(
    readFileSync(result.file, "utf8"),
  )![1]!;
}
