"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { diagnosticResultSchema } from "@/features/ai/contracts";

export function MockCheck() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    "Ready to test the local mock connection.",
  );

  async function runCheck() {
    setPending(true);
    setMessage("Checking the local mock connection…");
    try {
      const response = await fetch("/api/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId: "SYN-UG-01" }),
      });
      const result = diagnosticResultSchema.safeParse(await response.json());
      if (
        !result.success ||
        (response.ok && !result.data.ok) ||
        (!response.ok && result.data.ok)
      ) {
        setMessage(
          "The mock check returned an unexpected response. Try again.",
        );
      } else {
        setMessage(
          result.data.ok ? result.data.data.message : result.data.error.message,
        );
      }
    } catch {
      setMessage("The mock check is unavailable. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" disabled={pending} onClick={runCheck}>
        {pending ? "Checking…" : "Run mock check"}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className="text-sm leading-6 text-slate-600"
      >
        {message}
      </p>
    </div>
  );
}
