"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { btn } from "./ui";

/** "Report a problem" on every listing: goes to moderation, no account needed. */
export function ReportProblem({ target }: { target: string }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "sending" } | { kind: "done"; reference: string } | { kind: "error"; message: string }>({ kind: "idle" });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setState({ kind: "error", message: "Pick what is wrong." });
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target, reason, details }) });
      const data = await res.json();
      setState(res.ok ? { kind: "done", reference: data.reference } : { kind: "error", message: data.error ?? "Could not send the report." });
    } catch {
      setState({ kind: "error", message: "You seem to be offline. Try again when you're connected." });
    }
  };

  return (
    <details className="rounded-2xl border border-line bg-raised">
      <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold">Report a problem with this listing</summary>
      {state.kind === "done" ? (
        <p className="px-4 pb-4 text-[14px]" aria-live="polite">
          Thanks. Report <b className="font-mono">{state.reference}</b> is with the moderation team. Demo build: reports are kept in memory only.
        </p>
      ) : (
        <form onSubmit={send} className="grid gap-3 px-4 pb-4">
          <fieldset className="grid gap-1.5 text-[14px]">
            <legend className="mb-1 text-[13px] text-muted">What is wrong?</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r.id} className="flex items-center gap-2">
                <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-[var(--accent)]" />
                {r.label}
              </label>
            ))}
          </fieldset>
          <label className="grid gap-1 text-[13px] text-muted">
            Details (optional)
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-[14px] text-ink" />
          </label>
          {state.kind === "error" && (
            <p role="alert" className="rounded-lg bg-accent-soft px-3 py-2 text-[13.5px] text-accent-strong">
              {state.message}
            </p>
          )}
          <button type="submit" disabled={state.kind === "sending"} className={`${btn.ghost} ${btn.small} justify-self-start`}>
            {state.kind === "sending" ? "Sending…" : "Send report"}
          </button>
        </form>
      )}
    </details>
  );
}
