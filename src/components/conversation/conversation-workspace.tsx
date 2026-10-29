"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  scenarioSchema,
  sessionViewSchema,
  issueSchema,
  programDetailsSchema,
  type Scenario,
  type SessionView,
  type ProgramDetails,
} from "@/features/conversation/schema";
import { ProfileAnswer, fieldLabels, readable } from "./profile-answer";

const scenarios: Record<Scenario, { label: string; note: string }> = {
  bachelor: {
    label: "Bachelor's study",
    note: "A fictional computing applicant with an annual budget.",
  },
  master: {
    label: "Master's study",
    note: "A fictional applicant whose previous degree still needs clarification.",
  },
  phd: {
    label: "Funded PhD",
    note: "Explore how unknown funding and research conditions are shown.",
  },
  alternative: {
    label: "Above-budget alternative",
    note: "A programme is hidden until you allow its specific budget deviation.",
  },
  no_match: {
    label: "No matching programme",
    note: "An honest empty result from the limited catalogue.",
  },
  provider_unavailable: {
    label: "Explanation unavailable",
    note: "A simulated service failure, with a separate catalogue search option.",
  },
  published: {
    label: "Reviewed real catalogue",
    note: "Explore reviewed programme data. Individual fees and admission conditions may still need verification.",
  },
};
export function ConversationWorkspace({
  externalAi = false,
  remotePreview = false,
}: {
  externalAi?: boolean;
  remotePreview?: boolean;
}) {
  const [session, setSession] = useState<SessionView | null>(null);
  const [scenario, setScenario] = useState<Scenario>("bachelor");
  const [busy, setBusy] = useState(true);
  const [issue, setIssue] = useState<SessionView["issue"]>(null);
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<ProgramDetails | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [invite, setInvite] = useState("");
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let mounted = true;
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume" }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!mounted) return;
        if (response.ok) setSession(sessionViewSchema.parse(data.session));
        else if (response.status !== 401)
          setIssue(issueSchema.parse(data.error));
      })
      .catch(() => {
        if (mounted)
          setIssue({
            code: "INTERNAL_ERROR",
            message:
              "The local demonstration could not be reached. Reload to try again.",
          });
      })
      .finally(() => {
        if (mounted) setBusy(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  async function act(
    endpoint: string,
    body: Record<string, unknown>,
    method = "POST",
  ) {
    if (busy) return;
    setBusy(true);
    setIssue(null);
    setDetails(null);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = issueSchema.parse(data.error);
        setIssue(error);
        if (error.code === "SESSION_EXPIRED") setSession(null);
        if (error.code === "PROFILE_CONFLICT") {
          const refreshed = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "resume" }),
          });
          if (refreshed.ok)
            setSession(
              sessionViewSchema.parse((await refreshed.json()).session),
            );
        }
        return;
      }
      setSession(sessionViewSchema.parse(data.session));
      setInvite("");
      setEditing(null);
    } catch {
      setIssue({
        code: "INTERNAL_ERROR",
        message:
          "The request could not be completed. Check the connection and try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  const change = (body: Record<string, unknown>) =>
    act("profile", { ...body, revision: session!.revision }, "PATCH");
  async function send(event: FormEvent) {
    event.preventDefault();
    const text = message;
    setMessage("");
    await act("chat", {
      action: "message",
      revision: session!.revision,
      message: text,
    });
  }
  async function end() {
    setBusy(true);
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSession(null);
      setDetails(null);
      setEditing(null);
      setIssue(null);
      setMessage("");
      setFeedback("");
    } catch {
      setIssue({
        code: "INTERNAL_ERROR",
        message: "The session could not be ended. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  async function showSources(id: string) {
    setBusy(true);
    setDetails(null);
    try {
      const response = await fetch(`/api/programs/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (response.ok) setDetails(programDetailsSchema.parse(data.program));
      else {
        const error = issueSchema.parse(data.error);
        setIssue(error);
        if (error.code === "SESSION_EXPIRED") setSession(null);
      }
    } catch {
      setIssue({
        code: "INTERNAL_ERROR",
        message: "Sources could not be loaded. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  const visibleIssue = issue ?? session?.issue;
  const review = session?.fields.some(
    (f) => f.status === "user_stated" || f.proposals.length,
  );
  return (
    <div className="integrated-app">
      <a className="skip-link" href="#flow-main">
        Skip to main content
      </a>
      <header className="flow-header">
        <Link className="flow-brand" href="/">
          study<span>guide</span>
          <span className="flow-brand-dot">✦</span>
        </Link>
        <div className="flow-header-links">
          <span className="flow-pill">
            {remotePreview ? "Controlled preview" : "Local prototype"}
          </span>
          <a href="/preview">Design preview</a>
        </div>
      </header>
      <div className="flow-notice">
        <strong>Fictional details only.</strong>{" "}
        {externalAi
          ? "This controlled evaluation sends your fictional messages and limited profile/catalogue context to OpenAI for AI suggestions. The reviewed-catalogue choice can include its reviewed programme facts. Suggestions require your confirmation. The demonstration stops at 200 API attempts or USD 2 overall, USD 0.50 per UTC day, USD 0.10 per session or USD 0.01 per request, whichever limit is reached first, with no automatic retries. Responses are requested without stored conversation state; this does not guarantee zero provider retention. "
          : remotePreview
            ? "This controlled preview uses simulated explanations. "
            : "This local demonstration uses simulated explanations. "}
        Example scenarios use synthetic programmes and evidence. The reviewed
        real catalogue is a separate choice with limited coverage. Sessions last
        30 minutes and are stored temporarily{" "}
        {remotePreview ? "on this preview service" : "on this computer"}. Real
        PDF upload is disabled. Do not enter personal details or documents. At
        most 40 messages per session; token and daily limits may stop
        explanations earlier. Minimal operational records are kept for 24 hours;
        invitation-use and budget records survive session deletion. The
        organiser controls access; use is for invited adults with fictional
        details only.
      </div>
      <main id="flow-main" tabIndex={-1} aria-busy={busy}>
        <div className="flow-heading">
          <p className="flow-eyebrow">A little clarity for your next step</p>
          <h1>Your next chapter, with clearer choices.</h1>
          <p>
            Build a profile, understand the conditions, and explore a few
            relevant options.
          </p>
        </div>
        {visibleIssue && (
          <div className="flow-alert" role="alert">
            <strong>{visibleIssue.code.replaceAll("_", " ")}</strong>
            <p>{visibleIssue.message}</p>
          </div>
        )}
        {!session ? (
          <section
            className="flow-start flow-panel"
            aria-label="Start a demonstration"
          >
            <div>
              <span className="flow-step">01 · Start with an example</span>
              <h2>What would you like to explore?</h2>
              <p>
                Choose a fictional journey. You will review the details before
                they are used.
              </p>
            </div>
            <label htmlFor="demo-scenario">
              Demonstration
              <select
                id="demo-scenario"
                value={scenario}
                onChange={(e) =>
                  setScenario(scenarioSchema.parse(e.target.value))
                }
              >
                {Object.entries(scenarios).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="flow-muted">{scenarios[scenario].note}</p>
            <label htmlFor="invitation-code">
              Invitation code
              <input
                id="invitation-code"
                type="password"
                autoComplete="off"
                maxLength={43}
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
              />
            </label>
            <label className="flow-consent-label">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />{" "}
              I am 18 or older.
            </label>
            <label className="flow-consent-label">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />{" "}
              I accept the privacy notice above and will use fictional details
              only.
            </label>
            <button
              className="flow-button"
              disabled={busy || invite.length !== 43 || !adult || !accepted}
              onClick={() =>
                act("session/redeem", {
                  code: invite,
                  adult,
                  privacyNoticeAccepted: accepted,
                  noticeVersion: externalAi
                    ? "synthetic-openai-1"
                    : "synthetic-privacy-1",
                  scenario,
                })
              }
            >
              {busy ? "Loading…" : "Start demonstration"}
            </button>
          </section>
        ) : (
          <>
            <div className="flow-session-bar">
              <span className="flow-pill">
                {session.mode === "published"
                  ? "Reviewed real catalogue"
                  : "Synthetic demonstration"}
              </span>
              <span>{scenarios[session.scenario].label}</span>
              <button
                className="flow-link-button"
                disabled={busy}
                onClick={end}
              >
                End and clear session
              </button>
            </div>
            <div className="flow-grid">
              <section
                className="flow-panel flow-conversation"
                aria-label="Study conversation"
              >
                <div className="flow-panel-heading">
                  <span className="flow-step">
                    02 · Understand your priorities
                  </span>
                  <h2>Let&apos;s talk about your plans</h2>
                </div>
                <div
                  className="flow-messages"
                  role="log"
                  aria-label="Conversation messages"
                  aria-live="polite"
                >
                  {session.messages.map((item, i) => (
                    <div key={i} className={`flow-message ${item.role}`}>
                      <span>
                        {item.role === "user" ? "You" : "Study guide"}
                      </span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
                {session.questions.length > 0 && (
                  <div className="flow-questions">
                    <h3>A few details to clarify</h3>
                    {session.questions.map((q) => (
                      <p key={q.id}>{q.text}</p>
                    ))}
                  </div>
                )}
                {session.fields.find((f) => f.key === "studyLevel")?.status ===
                  "missing" && (
                  <button
                    className="flow-button secondary"
                    disabled={busy}
                    onClick={() => change({ action: "prepare_example" })}
                  >
                    Review example details
                  </button>
                )}
                <form className="flow-composer" onSubmit={send}>
                  <label htmlFor="study-message">
                    Ask about your study choices
                    <textarea
                      id="study-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={8000}
                      rows={3}
                      disabled={busy}
                      placeholder="Ask about sources, or try: My budget is 7000 EUR"
                    />
                  </label>
                  <div>
                    <small>{message.length.toLocaleString()} / 8,000</small>
                    <button
                      className="flow-button small"
                      disabled={busy || !message.trim()}
                      type="submit"
                    >
                      Send message
                    </button>
                  </div>
                  <p className="answer-hint">
                    This demonstration has limited message understanding. Use
                    the profile answers for other changes. Do not enter personal
                    details.
                  </p>
                </form>
              </section>
              <aside
                className="flow-panel flow-profile"
                aria-label="Your study profile"
              >
                <div className="flow-panel-heading">
                  <span className="flow-step">03 · Review your details</span>
                  <h2>Your study profile</h2>
                  <p>
                    {session.ready
                      ? "Confirmed and ready for a limited search."
                      : "Review suggestions and answer the remaining questions."}
                  </p>
                </div>
                <div className="flow-fields">
                  {session.fields
                    .filter(
                      (f) =>
                        f.status !== "missing" ||
                        session.requiredMissing.includes(f.key) ||
                        (session.scenario === "master" &&
                          f.key === "relevantSubjects"),
                    )
                    .map((f) => {
                      const proposed = f.proposals[0]?.value;
                      return (
                        <div className="flow-field" key={f.key}>
                          <div className="flow-field-title">
                            <strong>{fieldLabels[f.key]}</strong>
                            <span
                              className={`flow-status ${f.proposals.length ? "extracted_unconfirmed" : f.status}`}
                            >
                              {f.proposals.length ||
                              f.status === "extracted_unconfirmed"
                                ? "Needs confirmation"
                                : f.status === "user_stated"
                                  ? "Review answer"
                                  : readable(f.status)}
                            </span>
                          </div>
                          <p>{readable(proposed ?? f.value)}</p>
                          {f.proposals.length > 0 &&
                            f.status === "confirmed" && (
                              <p className="answer-hint">
                                Current confirmed answer: {readable(f.value)}.
                                Review the suggested change above before
                                confirming.
                              </p>
                            )}
                          {f.status === "conflicting" ? (
                            <div className="flow-conflict">
                              {f.candidates.map((candidate, i) => (
                                <button
                                  key={i}
                                  className="flow-button small secondary"
                                  disabled={busy}
                                  onClick={() =>
                                    change({
                                      action: "resolve",
                                      field: f.key,
                                      value: candidate,
                                    })
                                  }
                                >
                                  Keep {readable(candidate)}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button
                              className="flow-link-button"
                              disabled={busy}
                              onClick={() =>
                                setEditing(editing === f.key ? null : f.key)
                              }
                            >
                              {f.status === "missing"
                                ? `Answer ${fieldLabels[f.key]}`
                                : `Edit ${fieldLabels[f.key]}`}
                            </button>
                          )}
                          {editing === f.key && (
                            <ProfileAnswer
                              key={`${f.key}-${session.revision}`}
                              field={f.key}
                              value={proposed ?? f.value}
                              disabled={busy}
                              onSave={(value) =>
                                change({
                                  action: "answer",
                                  field: f.key,
                                  value,
                                  mode: "replace",
                                })
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
                {review && (
                  <button
                    className="flow-button"
                    disabled={busy}
                    onClick={() => change({ action: "confirm" })}
                  >
                    Confirm these details
                  </button>
                )}
                {!session.ready && (
                  <p className="answer-hint">
                    Recommendations remain unavailable until the required
                    details are confirmed and conflicts are resolved.
                  </p>
                )}
              </aside>
            </div>
            <section className="flow-results" aria-label="Programme results">
              <div className="flow-results-heading">
                <div>
                  <span className="flow-step">04 · Explore your options</span>
                  <h2>A few options, with reasons</h2>
                  <p>
                    Requirements are checked against your confirmed profile.
                    Unknown conditions stay visible.
                  </p>
                </div>
                <div className="flow-search-actions">
                  <button
                    className="flow-button"
                    disabled={busy || !session.ready}
                    onClick={() =>
                      act("recommendations", {
                        action: "search",
                        revision: session.revision,
                        explain: true,
                      })
                    }
                  >
                    Find programmes
                  </button>
                  <button
                    className="flow-button secondary"
                    disabled={busy || !session.ready}
                    onClick={() =>
                      act("recommendations", {
                        action: "search",
                        revision: session.revision,
                        explain: false,
                      })
                    }
                  >
                    Browse without explanation
                  </button>
                </div>
              </div>
              {!session.matching && (
                <div className="flow-empty">
                  <span>✦</span>
                  <p>
                    {session.ready
                      ? "Your profile is ready. Start a catalogue search to see what is available."
                      : "Your options will appear here after you confirm your study profile."}
                  </p>
                </div>
              )}
              {session.matching && (
                <>
                  <p className="flow-result-message">
                    {session.matching.message}
                  </p>
                  {session.matching.options.length === 0 && (
                    <div className="flow-empty">
                      <p>
                        No programmes are currently visible for these
                        requirements.
                      </p>
                    </div>
                  )}
                  {session.matching.permissionRequests.map((permission) => (
                    <div
                      className="flow-permission flow-panel"
                      key={permission.requestId}
                    >
                      <h3>Would you like to see an alternative?</h3>
                      <p>{permission.message}</p>
                      <ul>
                        {permission.deviations.map((d, i) => (
                          <li key={i}>{d.message}</li>
                        ))}
                      </ul>
                      <button
                        className="flow-button"
                        disabled={busy}
                        onClick={() =>
                          act("recommendations", {
                            action: "consent",
                            revision: session.revision,
                            requestId: permission.requestId,
                            decision: "granted",
                          })
                        }
                      >
                        Allow this alternative
                      </button>
                      <button
                        className="flow-button secondary flow-decline"
                        disabled={busy}
                        onClick={() =>
                          act("recommendations", {
                            action: "consent",
                            revision: session.revision,
                            requestId: permission.requestId,
                            decision: "revoked",
                          })
                        }
                      >
                        Keep my requirements
                      </button>
                      <p className="answer-hint">
                        Permission applies only to this alternative and the
                        current profile. Institutional requirements still apply.
                      </p>
                    </div>
                  ))}
                  <div className="flow-programmes">
                    {session.matching.options.map((option) => (
                      <article
                        className="flow-panel flow-programme"
                        key={option.programId}
                      >
                        <div className="flow-programme-top">
                          <span className="flow-pill">
                            {session.mode === "published"
                              ? "Reviewed programme"
                              : "Synthetic example"}
                          </span>
                          <span className="flow-status">
                            {option.kind === "conditional_alternative"
                              ? "Conditional alternative"
                              : option.kind === "needs_verification"
                                ? "Needs verification"
                                : "Within stated limits"}
                          </span>
                        </div>
                        <h3>{option.name}</h3>
                        <p>
                          {option.institution} · {option.country} · 2027 intake
                        </p>
                        <h4>Why it appears</h4>
                        <ul>
                          {option.reasons.map((reason) => (
                            <li key={reason.code}>
                              {reason.message}
                              {reason.sourceIds.length > 0 && (
                                <small className="flow-evidence">
                                  {session.mode === "published"
                                    ? "Reviewed evidence:"
                                    : "Fictional evidence:"}{" "}
                                  {reason.sourceIds.join(", ")}
                                </small>
                              )}
                            </li>
                          ))}
                        </ul>
                        <h4>Conditions to check</h4>
                        <ul>
                          {option.checks.map((check) => (
                            <li key={check.ruleId}>
                              <span>{check.label}</span>{" "}
                              <strong>{readable(check.status)}:</strong>{" "}
                              {check.message}
                              {check.sourceIds.length > 0 && (
                                <small className="flow-evidence">
                                  {session.mode === "published"
                                    ? "Reviewed evidence:"
                                    : "Fictional evidence:"}{" "}
                                  {check.sourceIds.join(", ")}
                                </small>
                              )}
                            </li>
                          ))}
                        </ul>
                        {(option.warnings.length > 0 ||
                          option.deviations.length > 0) && (
                          <div className="flow-card-warning">
                            <ul>
                              {[
                                ...option.warnings,
                                ...option.deviations.map((d) => d.message),
                              ].map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="flow-next-step">
                          <strong>Next step:</strong> {option.nextStep}
                        </p>
                        <button
                          className="flow-button small secondary"
                          disabled={busy}
                          onClick={() => showSources(option.programId)}
                        >
                          View sources for {option.name}
                        </button>
                        {details?.programId === option.programId && (
                          <section
                            className="flow-sources"
                            aria-label={`Sources for ${option.name}`}
                          >
                            <h4>
                              {details.synthetic
                                ? "Fictional demonstration evidence"
                                : "Official programme sources"}
                            </h4>
                            {details.sources.map((source) => (
                              <div key={source.id}>
                                <strong>{source.label}</strong>
                                {source.url && (
                                  <p>
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Open official source
                                    </a>
                                  </p>
                                )}
                                <p>{source.note}</p>
                                <small>
                                  Checked {source.checkedOn} · {source.id} ·
                                  Facts: {source.factIds.join(", ")}
                                </small>
                              </div>
                            ))}
                            {details.unknowns.length > 0 && (
                              <>
                                <h4>Unknown conditions</h4>
                                <ul>
                                  {details.unknowns.map((unknown, i) => (
                                    <li key={i}>{unknown}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                            <p>{details.nextStep}</p>
                            <button
                              className="flow-link-button"
                              onClick={() => setDetails(null)}
                            >
                              Close sources
                            </button>
                          </section>
                        )}
                      </article>
                    ))}
                  </div>
                  {session.matching.gaps.length > 0 && (
                    <details className="flow-gaps">
                      <summary>Remaining gaps and limitations</summary>
                      <ul>
                        {session.matching.gaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
              {session.grants.map((grant) => (
                <div className="flow-grant" key={grant.requestId}>
                  <p>{grant.message}</p>
                  <button
                    className="flow-link-button"
                    disabled={busy}
                    onClick={() =>
                      act("recommendations", {
                        action: "consent",
                        revision: session.revision,
                        requestId: grant.requestId,
                        decision: "revoked",
                      })
                    }
                  >
                    Withdraw alternative permission
                  </button>
                </div>
              ))}
            </section>
            <section className="flow-feedback flow-panel">
              <h2>How did this demonstration feel?</h2>
              <p>
                Feedback stays in this temporary local session. It is not sent
                anywhere.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("feedback", {
                    revision: session.revision,
                    kind: "other",
                    message: feedback,
                    programId: null,
                  });
                  setFeedback("");
                }}
              >
                <label htmlFor="flow-feedback">
                  Optional feedback, using fictional details
                  <textarea
                    id="flow-feedback"
                    maxLength={500}
                    rows={2}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </label>
                <button
                  className="flow-button small secondary"
                  disabled={busy}
                  type="submit"
                >
                  Save local feedback
                </button>
              </form>
              {session.feedbackCount > 0 && (
                <p role="status">
                  {session.feedbackCount} feedback item(s) saved in this
                  session.
                </p>
              )}
            </section>
          </>
        )}
        <p className="flow-working" role="status" aria-live="polite">
          {busy ? "Working on your request…" : ""}
        </p>
      </main>
      <footer className="flow-footer">
        Study guide · Clear sources. Honest unknowns. Your decisions.
      </footer>
    </div>
  );
}
