"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { StudyLevel } from "@/features/profiles/types";
import {
  alternativeProgram,
  examplePrograms,
  levelExamples,
  makeProfile,
  previewMessages,
  scenarios,
  type DemoMessage,
  type DemoProfile,
  type Scene,
} from "@/test-fixtures/ui-demo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Notice } from "@/components/ui/notice";
import { ProfilePanel } from "./profile-panel";
import { ProgramCard } from "./program-card";

type Panel = "conversation" | "profile" | "options";
const stateCopy: Partial<
  Record<
    Scene,
    {
      title: string;
      body: string;
      tone: "warning" | "error" | "info" | "unknown";
    }
  >
> = {
  conflict: {
    title: "Let’s resolve one conflict",
    body: "Your country limits disagree. Choose which to keep in your brief before exploring options.",
    tone: "warning",
  },
  "no-match": {
    title: "No example matches",
    body: "No suitable option is represented in this sample. This does not mean no suitable program exists.",
    tone: "info",
  },
  "empty-catalog": {
    title: "The example catalog is empty",
    body: "There is nothing to compare with this brief yet. A catalog gap is not a judgement about your eligibility.",
    tone: "unknown",
  },
  unverified: {
    title: "A source needs verification",
    body: "Requirements for the 2027 intake are not verified. An older or missing source cannot establish current eligibility.",
    tone: "warning",
  },
  "out-of-scope": {
    title: "Let’s stay with study choices",
    body: "This guide focuses on education and related application steps. It cannot answer this unrelated question.",
    tone: "info",
  },
  "server-error": {
    title: "Something went wrong",
    body: "The preview request could not be completed. Your example brief has been kept. Try again when you’re ready.",
    tone: "error",
  },
  "ai-unavailable": {
    title: "The AI guide is unavailable",
    body: "Your example brief is still here. You can review example options without the conversation service.",
    tone: "warning",
  },
};

export function StudyWorkspace() {
  const [scene, setScene] = useState<Scene>("welcome");
  const [level, setLevel] = useState<StudyLevel>("undergraduate");
  const [panel, setPanel] = useState<Panel>("conversation");
  const [profile, setProfile] = useState<DemoProfile>(() =>
    makeProfile("undergraduate", true),
  );
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState("");
  const [consent, setConsent] = useState(false);
  const [changed, setChanged] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function stopLoading() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function showScene(next: Scene, nextLevel = level) {
    if (next === "permission" || next === "conditional" || next === "conflict")
      nextLevel = "undergraduate";
    const preserveBrief =
      (next === "server-error" || next === "ai-unavailable") &&
      scene !== "welcome" &&
      scene !== "expired";
    stopLoading();
    setScene(next);
    setLevel(nextLevel);
    setConsent(false);
    setChanged(preserveBrief ? changed : false);
    setDraft("");
    setInputError("");
    setAnnouncement("");
    let nextProfile = preserveBrief
      ? profile
      : makeProfile(
          nextLevel,
          next === "welcome" || next === "partial" || next === "expired",
          next === "permission" || next === "conditional",
        );
    if (
      !preserveBrief &&
      [
        "recommendations",
        "one",
        "two",
        "unverified",
        "loading",
        "permission",
        "conditional",
        "server-error",
        "ai-unavailable",
      ].includes(next)
    ) {
      nextProfile = {
        ...nextProfile,
        fields: Object.fromEntries(
          Object.entries(nextProfile.fields).map(([key, field]) => [
            key,
            { ...field, status: "confirmed" },
          ]),
        ) as DemoProfile["fields"],
      };
    }
    if (next === "conflict")
      nextProfile = {
        ...makeProfile("undergraduate"),
        fixtureId: "SYN-X-01",
        fields: {
          ...makeProfile("undergraduate").fields,
          goal: {
            label: "Study goal",
            value: "Business · practical learning",
            status: "stated",
          },
          country: {
            label: "Country · firm limit",
            value: "Serbia only / Germany only",
            status: "conflict",
          },
          budget: {
            label: "Annual budget",
            value: "EUR 10,000 / year · total",
            status: "stated",
          },
        },
      };
    setProfile(nextProfile);
    setMessages(
      preserveBrief
        ? messages
        : next === "permission" || next === "conditional"
          ? [
              {
                id: "alt-goal",
                role: "user",
                text: "I only want Germany and an English-taught bachelor's in economics.",
              },
              {
                id: "alt-question",
                role: "assistant",
                text: "No primary example is shown. An option outside your country limit needs your permission before it can appear.",
              },
            ]
          : previewMessages(next, nextLevel),
    );
    setPanel(
      next === "welcome" ||
        next === "partial" ||
        next === "expired" ||
        next === "out-of-scope"
        ? "conversation"
        : "options",
    );
  }
  function start(nextLevel: StudyLevel) {
    showScene("partial", nextLevel);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) {
      setInputError("Write a fictional study goal or use a sample below.");
      composer.current?.focus();
      return;
    }
    const text = draft.trim();
    if (scene === "welcome") {
      start(level);
      setMessages([
        { id: "user-goal", role: "user", text },
        {
          id: "sample-note",
          role: "assistant",
          text: `For this fictional walkthrough, we’ll use the ${levelExamples[level].title.toLowerCase()} example brief. You can edit it after adding the sample details.`,
        },
        {
          id: "question",
          role: "assistant",
          text: levelExamples[level].question,
        },
      ]);
    } else {
      setMessages((previous) => [
        ...previous,
        { id: `user-${previous.length}`, role: "user", text },
        {
          id: `note-${previous.length}`,
          role: "assistant",
          text: "This preview uses the sample details rather than interpreting your message. Add the example answer below, then review or edit your brief.",
        },
      ]);
      setDraft("");
      setInputError("");
    }
  }
  function addAnswer() {
    setProfile(makeProfile(level));
    setScene("ready");
    setDraft("");
    setInputError("");
    setMessages((previous) => [
      ...previous,
      { id: "sample-answer", role: "user", text: levelExamples[level].answer },
      {
        id: "review",
        role: "assistant",
        text: "Your fictional brief is ready to review. Please confirm the proposed details, or correct them first. This is not an admission assessment.",
      },
    ]);
    setAnnouncement("Sample details added. Review and confirm your brief.");
    setPanel("profile");
  }
  function confirm() {
    setProfile((previous) => ({
      ...previous,
      fields: Object.fromEntries(
        Object.entries(previous.fields).map(([key, field]) => [
          key,
          { ...field, status: "confirmed" },
        ]),
      ) as DemoProfile["fields"],
    }));
    setMessages((previous) => [
      ...previous,
      {
        id: `confirmed-${previous.length}`,
        role: "assistant",
        text: "Your fictional brief is now confirmed. You can explore the example options. Sources and unresolved requirements still need checking; admission is never guaranteed.",
      },
    ]);
    setAnnouncement(
      "Your example brief is confirmed. You can now explore illustrative options.",
    );
  }
  const isConfirmed = Object.values(profile.fields).every(
    (field) => field.status === "confirmed",
  );
  function findOptions() {
    stopLoading();
    setScene("loading");
    setPanel("options");
    setAnnouncement("Showing the loading preview.");
    timer.current = setTimeout(() => {
      setScene(
        level === "undergraduate"
          ? "one"
          : level === "master"
            ? "two"
            : "unverified",
      );
      setAnnouncement(
        "Example options are ready. These are fictional illustrations.",
      );
      timer.current = null;
    }, 850);
  }
  function saveProfile(next: DemoProfile) {
    stopLoading();
    setProfile(next);
    setScene("ready");
    setConsent(false);
    setChanged(true);
    setAnnouncement(
      "Changes saved locally. Previous example results and alternative permission were cleared.",
    );
  }
  const permissionNeeded = scene === "permission" || scene === "conditional";
  const count =
    scene === "recommendations"
      ? 3
      : scene === "two"
        ? 2
        : scene === "one" || scene === "unverified"
          ? 1
          : 0;
  const programs = examplePrograms(level)
    .slice(0, count)
    .map((program) =>
      scene === "unverified"
        ? {
            ...program,
            conditional: true,
            unknown:
              "The source for the 2027 intake is unverified. Current requirements and availability are unknown.",
          }
        : program,
    );
  const notice = stateCopy[scene];

  return (
    <div className="study-app">
      <a className="skip-link" href="#study-workspace">
        Skip to study workspace
      </a>
      <header className="app-header">
        <Link
          href="/"
          className="brand"
          aria-label="Study guide home"
          onClick={() => showScene("welcome")}
        >
          <span className="brand-mark">
            <Icon name="sparkle" size={22} />
          </span>
          <span>
            study<span className="brand-light">guide</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>
        <span className="header-note">
          A clearer way to explore your next chapter
        </span>
        <div className="header-actions">
          <span className="demo-badge">Synthetic demo</span>
          <Button variant="ghost" onClick={() => showScene("welcome")}>
            <Icon name="reset" size={16} />
            <span>Start over</span>
          </Button>
        </div>
      </header>
      <div className="demo-disclosure">
        <Icon name="info" size={16} />
        <p>
          <strong>Explore an example, not real advice.</strong> All profiles,
          programs and sources are fictional. No data is sent or saved. The
          future catalog will cover only reviewed programs in Serbia and the EU,
          not every available option.
        </p>
      </div>
      <div className="workspace-topline">
        <div>
          <p className="eyebrow">Your study workspace</p>
          <h1>Make room for what’s next.</h1>
        </div>
        <details className="scenario-picker">
          <summary>
            Preview scenarios <span aria-hidden="true">⌄</span>
          </summary>
          <div className="scenario-controls">
            <label htmlFor="preview-state">Show a UI state</label>
            <select
              id="preview-state"
              value={scene}
              onChange={(event) => showScene(event.target.value as Scene)}
            >
              {scenarios.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <p>
              Intentional examples for reviewing this prototype. These are
              simulated states.
            </p>
          </div>
        </details>
      </div>
      <nav className="mobile-panels" aria-label="Workspace panels">
        {(
          [
            ["conversation", "Conversation", "chat"],
            ["profile", "Study brief", "book"],
            ["options", "Options", "search"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            aria-pressed={panel === id}
            onClick={() => setPanel(id)}
          >
            <Icon name={icon} size={17} />
            {label}
            {id === "options" && count > 0 && (
              <span className="panel-count">{count}</span>
            )}
          </button>
        ))}
      </nav>
      <main
        id="study-workspace"
        tabIndex={-1}
        className={`workspace ${scene === "expired" ? "workspace-expired" : ""}`}
        data-scene={scene}
      >
        {scene === "expired" ? (
          <section
            className="expired-card panel"
            aria-labelledby="expired-heading"
          >
            <span className="empty-symbol">
              <Icon name="reset" size={30} />
            </span>
            <p className="eyebrow">Expiry preview</p>
            <h2 id="expired-heading">Your session has expired</h2>
            <p>
              The previous example brief and conversation are no longer shown.
              Start a new example to continue.
            </p>
            <Button onClick={() => showScene("welcome")}>
              Start a new example
              <Icon name="arrow" size={17} />
            </Button>
            <p className="fine-print">
              This is a UI simulation; no real session was created.
            </p>
          </section>
        ) : (
          <>
            <div
              className={`profile-column ${panel === "profile" ? "mobile-active" : ""}`}
            >
              <ProfilePanel
                key={`${scene}-${profile.fixtureId}`}
                profile={profile}
                empty={scene === "welcome"}
                onSave={saveProfile}
                onConfirm={confirm}
                onResolve={(country) => {
                  setProfile((previous) => ({
                    ...previous,
                    fields: {
                      ...previous.fields,
                      country: {
                        ...previous.fields.country,
                        value: country,
                        status: "confirmed",
                      },
                    },
                  }));
                  setScene("ready");
                  setChanged(true);
                  setConsent(false);
                  setAnnouncement(
                    "Country conflict resolved. Previous example results were cleared.",
                  );
                }}
              />
            </div>
            <section
              className={`conversation-panel panel ${panel === "conversation" ? "mobile-active" : ""}`}
              aria-labelledby="conversation-heading"
            >
              <div className="conversation-heading">
                <div>
                  <span className="guide-avatar">
                    <Icon name="sparkle" size={19} />
                  </span>
                  <div>
                    <h2 id="conversation-heading">Let’s find your direction</h2>
                    <p>Example study conversation</p>
                  </div>
                </div>
                <span className="small-label">Preview</span>
              </div>
              <div className="conversation-content">
                {scene === "welcome" ? (
                  <div className="welcome-content">
                    <div className="welcome-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <span>
                        <Icon name="sparkle" size={36} />
                      </span>
                      <i className="art-dot dot-one" />
                      <i className="art-dot dot-two" />
                    </div>
                    <p className="eyebrow">Start with a possibility</p>
                    <h2>
                      A path that feels
                      <br />
                      like you.
                    </h2>
                    <p>
                      Explore what you want to study, what matters to you, and
                      what to check next. A few thoughtful questions can make
                      the picture clearer.
                    </p>
                    <div
                      className="level-choices"
                      aria-label="Choose a sample study level"
                    >
                      {(Object.keys(levelExamples) as StudyLevel[]).map(
                        (choice) => (
                          <Button
                            key={choice}
                            variant="secondary"
                            onClick={() => start(choice)}
                          >
                            {levelExamples[choice].title}
                            <Icon name="arrow" size={14} />
                          </Button>
                        ),
                      )}
                    </div>
                    <p className="fine-print">
                      Choose a fictional example to try the full walkthrough.
                    </p>
                  </div>
                ) : (
                  <>
                    <ol className="messages" aria-label="Example conversation">
                      {messages.map((message) => (
                        <li
                          key={message.id}
                          className={`message message-${message.role}`}
                        >
                          <span className="message-author">
                            {message.role === "user"
                              ? "You · example"
                              : "Study guide · preview"}
                          </span>
                          <p>{message.text}</p>
                        </li>
                      ))}
                    </ol>
                    {scene === "partial" && (
                      <div className="sample-answer">
                        <p className="tiny-label">Try the sample reply</p>
                        <p>{levelExamples[level].answer}</p>
                        <Button variant="secondary" onClick={addAnswer}>
                          Use these example details
                          <Icon name="arrow" size={15} />
                        </Button>
                      </div>
                    )}
                    {scene === "ready" && (
                      <div className="conversation-action">
                        {changed ? (
                          <Notice
                            title="Your correction is saved"
                            tone="success"
                          >
                            Previous results and permissions were cleared. This
                            fixed walkthrough cannot recalculate options for an
                            edited brief. Start over to explore the original
                            examples.
                          </Notice>
                        ) : (
                          <>
                            <Notice
                              title={
                                isConfirmed
                                  ? "Ready to explore"
                                  : "Review your brief first"
                              }
                              tone={isConfirmed ? "success" : "info"}
                            >
                              {isConfirmed
                                ? "We’ll show fictional options for this example, with reasons and things to verify."
                                : "Confirm the proposed details in your study brief before continuing."}
                            </Notice>
                            <Button
                              onClick={findOptions}
                              disabled={!isConfirmed}
                            >
                              Explore example options
                              <Icon name="arrow" size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {scene === "loading" && (
                      <Notice title="Exploring example options…" live>
                        <span className="loading-dot" aria-hidden="true" />
                        This shows how the search state will look. No real
                        search or AI request is running.
                      </Notice>
                    )}
                    {notice && (
                      <div className="conversation-notice">
                        <Notice title={notice.title} tone={notice.tone} live>
                          {notice.body}
                        </Notice>
                        {scene === "server-error" && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setScene(
                                Object.values(profile.fields).some(
                                  (field) => field.status === "missing",
                                )
                                  ? "partial"
                                  : "ready",
                              );
                              setPanel("conversation");
                              setAnnouncement(
                                "Preview restored. Your existing brief was kept.",
                              );
                            }}
                          >
                            Try again
                          </Button>
                        )}
                        {scene === "ai-unavailable" && (
                          <Button
                            variant="secondary"
                            disabled={changed || !isConfirmed}
                            onClick={() => {
                              setScene(
                                level === "master"
                                  ? "two"
                                  : level === "phd"
                                    ? "unverified"
                                    : "one",
                              );
                              setPanel("options");
                            }}
                          >
                            Review example options
                          </Button>
                        )}
                        {scene === "out-of-scope" && (
                          <Button
                            variant="secondary"
                            onClick={() => showScene("partial")}
                          >
                            Return to study choices
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <form className="composer" onSubmit={submit} noValidate>
                <label htmlFor="study-message">
                  {scene === "welcome"
                    ? "Your fictional study goal"
                    : "Continue the example conversation"}
                </label>
                <div className="composer-input">
                  <textarea
                    ref={composer}
                    id="study-message"
                    value={draft}
                    maxLength={600}
                    rows={2}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setInputError("");
                    }}
                    placeholder={
                      scene === "welcome"
                        ? "What would you like to study?"
                        : "Try a fictional follow-up…"
                    }
                    aria-invalid={Boolean(inputError)}
                    aria-describedby={
                      inputError ? "message-error" : "composer-hint"
                    }
                    disabled={
                      scene === "loading" ||
                      scene === "server-error" ||
                      scene === "ai-unavailable"
                    }
                  />
                  <Button
                    type="submit"
                    disabled={
                      scene === "loading" ||
                      scene === "server-error" ||
                      scene === "ai-unavailable"
                    }
                    aria-label="Send example message"
                  >
                    <Icon name="arrow" size={20} />
                  </Button>
                </div>
                {inputError && (
                  <p id="message-error" className="field-error" role="alert">
                    {inputError}
                  </p>
                )}
                <p id="composer-hint" className="fine-print">
                  Fictional details only · fixed sample replies · nothing is
                  sent or saved
                </p>
              </form>
            </section>
            <section
              className={`options-panel ${panel === "options" ? "mobile-active" : ""}`}
              aria-labelledby="options-heading"
            >
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">A few possibilities</p>
                  <h2 id="options-heading">Your example options</h2>
                </div>
                {count > 0 && <span className="option-total">{count}</span>}
              </div>
              <p className="panel-description">
                Reasons, sources and open questions. No admission score or
                guarantees.
              </p>
              {permissionNeeded ? (
                <div className="permission-card panel">
                  {!consent ? (
                    <>
                      <span className="badge badge-warning">
                        Your permission first
                      </span>
                      <h3>A little beyond your country limit?</h3>
                      <p>
                        There may be an illustrative option in Italy, outside
                        your Germany-only constraint. Would you like to explore
                        it?
                      </p>
                      <p className="fine-print">
                        This permits exploring Italy only. It does not change
                        your original brief or waive university requirements.
                      </p>
                      <div className="inline-actions">
                        <Button
                          onClick={() => {
                            setConsent(true);
                            setScene("conditional");
                            setAnnouncement(
                              "Permission granted to explore Italy only. A conditional example is now shown.",
                            );
                          }}
                        >
                          Yes, explore Italy
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setConsent(false);
                            setScene("no-match");
                            setAnnouncement(
                              "We’ll keep your Germany-only limit. No alternative is shown.",
                            );
                          }}
                        >
                          No, keep my limit
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Notice
                        title="Italy exploration permitted"
                        tone="warning"
                      >
                        Your original Germany-only limit is unchanged. This is a
                        conditional illustration, not a verified match.
                      </Notice>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setConsent(false);
                          setScene("permission");
                          setAnnouncement(
                            "Permission withdrawn. The alternative was removed.",
                          );
                        }}
                      >
                        Withdraw permission
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
              {permissionNeeded && consent && (
                <ProgramCard
                  key={alternativeProgram.id}
                  program={alternativeProgram}
                  index={0}
                />
              )}
              {programs.map((program, index) => (
                <ProgramCard
                  key={`${scene}-${program.id}`}
                  program={program}
                  index={index}
                />
              ))}
              {scene === "loading" && (
                <div className="loading-card panel" role="status">
                  <span className="loading-orb" aria-hidden="true" />
                  <h3>Making the picture clearer</h3>
                  <p>Exploring the sample brief and example options…</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      stopLoading();
                      setScene(
                        level === "undergraduate"
                          ? "one"
                          : level === "master"
                            ? "two"
                            : "unverified",
                      );
                    }}
                  >
                    Finish loading preview
                  </Button>
                </div>
              )}
              {!count && !permissionNeeded && scene !== "loading" && (
                <div className="options-empty panel">
                  <span className="empty-symbol">
                    <Icon
                      name={scene === "empty-catalog" ? "book" : "search"}
                      size={26}
                    />
                  </span>
                  <h3>
                    {scene === "no-match"
                      ? "No options in this example"
                      : scene === "empty-catalog"
                        ? "A catalog gap, not a closed door"
                        : scene === "conflict"
                          ? "Resolve the country conflict first"
                          : "Your possibilities will appear here"}
                  </h3>
                  <p>
                    {scene === "no-match" || scene === "empty-catalog"
                      ? "A real next step is to check official program pages for coverage and requirements. This demo has no real program links."
                      : "Start with your goal, build a brief, then review a small set of illustrative options."}
                  </p>
                </div>
              )}
              {count > 0 && (
                <p className="options-footnote">
                  Every card is fictional. Amounts, requirements and the
                  simulated check date are for UI demonstration only.
                </p>
              )}
            </section>
          </>
        )}
      </main>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <footer className="app-footer">
        <span>Thoughtful choices start with better questions.</span>
        <span>Serbia & EU · English preview · no saved data</span>
      </footer>
    </div>
  );
}
