import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { ControlLedger, ledgerPath } from "../src/server/security/control.ts";

// Local operator utility; never exposed as an HTTP administration endpoint.
const ledger = new ControlLedger(ledgerPath());
try {
  const [command, argument] = process.argv.slice(2);
  if (command === "create") {
    const invite = ledger.createInvite(Number(argument ?? "1"));
    const path = resolve(dirname(ledgerPath()), "local-review-invitation.txt");
    writeFileSync(
      path,
      `Invitation ID: ${invite.id}\nCode: ${invite.code}\nExpires: ${new Date(invite.expiresAt).toISOString()}\nMaximum uses: ${invite.maxUses}\nLocal adult-only synthetic review. Do not publish this file.\n`,
      { mode: 0o600 },
    );
    console.log(
      JSON.stringify({
        id: invite.id,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        file: path,
      }),
    );
  } else if (command === "revoke" && argument) {
    ledger.revokeInvite(argument);
    console.log("Invitation revoked; its sessions are invalidated.");
  } else throw new Error("Use create [1..100] or revoke <invitation ID>.");
} finally {
  ledger.close();
}
