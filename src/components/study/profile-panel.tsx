"use client";

import { useRef, useState, type FormEvent } from "react";
import type { DemoProfile, FieldStatus } from "@/test-fixtures/ui-demo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";

const statusLabels: Record<FieldStatus, string> = {
  stated: "You stated",
  proposed: "Please confirm",
  confirmed: "Confirmed",
  missing: "Unknown",
  conflict: "Conflict",
};

export function ProfilePanel({
  profile,
  empty,
  onSave,
  onConfirm,
  onResolve,
}: {
  profile: DemoProfile;
  empty: boolean;
  onSave: (profile: DemoProfile) => void;
  onConfirm: () => void;
  onResolve: (country: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [country, setCountry] = useState(profile.fields.country.value);
  const [goal, setGoal] = useState(profile.fields.goal.value);
  const [budget, setBudget] = useState(
    profile.fields.budget.value.replace(/[^0-9]/g, ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editButton = useRef<HTMLButtonElement>(null);
  const hasMissing = Object.values(profile.fields).some(
    (field) => field.status === "missing",
  );
  const hasConflict = profile.fields.country.status === "conflict";
  const confirmed = Object.values(profile.fields).every(
    (field) => field.status === "confirmed",
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!goal.trim()) nextErrors.goal = "Enter a fictional study goal.";
    if (!country.trim())
      nextErrors.country = "Enter a country limit for the example.";
    if (
      !budget.trim() ||
      !Number.isFinite(Number(budget)) ||
      Number(budget) <= 0
    )
      nextErrors.budget = "Enter a positive annual amount in EUR.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`edit-${first}`)?.focus();
      return;
    }
    onSave({
      ...profile,
      fields: {
        ...profile.fields,
        goal: {
          ...profile.fields.goal,
          value: goal.trim(),
          status: "confirmed",
        },
        country: {
          ...profile.fields.country,
          value: country.trim(),
          status: "confirmed",
        },
        budget: {
          ...profile.fields.budget,
          value: `EUR ${new Intl.NumberFormat("en-GB").format(Number(budget))} / year · ${profile.level === "phd" ? "personal top-ups" : "total"}`,
          status: "confirmed",
        },
      },
    });
    setEditing(false);
    requestAnimationFrame(() => document.getElementById("edit-brief")?.focus());
  }

  return (
    <aside className="profile-panel panel" aria-labelledby="profile-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">The starting point</p>
          <h2 id="profile-heading">Your study brief</h2>
        </div>
        <Icon name="book" size={21} />
      </div>
      <p className="panel-description">
        Your priorities, in one place. You stay in control.
      </p>
      {empty ? (
        <div className="profile-empty">
          <span className="empty-symbol">
            <Icon name="edit" size={26} />
          </span>
          <h3>It starts with your goal</h3>
          <p>Your example brief will build as the conversation unfolds.</p>
          <div className="empty-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : (
        <>
          <div className="profile-level">
            <span className="badge badge-info">
              {profile.level === "undergraduate"
                ? "Bachelor’s"
                : profile.level === "master"
                  ? "Master’s"
                  : "PhD research"}
            </span>
            <span className="fine-print">Fictional profile</span>
          </div>
          <dl className="profile-fields">
            {Object.entries(profile.fields).map(([id, field]) => (
              <div key={id} className={`profile-field field-${field.status}`}>
                <dt>{field.label}</dt>
                <dd>
                  {field.value}
                  <span className={`field-status status-${field.status}`}>
                    {field.status === "confirmed" && (
                      <Icon name="check" size={12} />
                    )}
                    {statusLabels[field.status]}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          {hasConflict && (
            <div className="conflict-controls">
              <p>Choose the country limit you want to keep:</p>
              <Button
                variant="secondary"
                onClick={() => onResolve("Serbia only")}
              >
                Use Serbia only
              </Button>
              <Button
                variant="secondary"
                onClick={() => onResolve("Germany only")}
              >
                Use Germany only
              </Button>
            </div>
          )}
          {!editing && (
            <div className="profile-actions">
              <Button
                ref={editButton}
                id="edit-brief"
                variant="secondary"
                disabled={hasMissing || hasConflict}
                onClick={() => {
                  setEditing(true);
                  setErrors({});
                }}
              >
                {" "}
                <Icon name="edit" size={15} />
                Edit brief
              </Button>
              <Button
                variant="ghost"
                disabled={hasMissing || hasConflict || confirmed}
                onClick={onConfirm}
              >
                {confirmed ? (
                  <>
                    <Icon name="check" size={15} />
                    Confirmed
                  </>
                ) : (
                  "Confirm brief"
                )}
              </Button>
            </div>
          )}
          {editing && (
            <form
              onSubmit={save}
              className="profile-editor"
              aria-label="Edit fictional brief"
              noValidate
            >
              <h3>Correct the example</h3>
              <p className="fine-print">
                Use fictional details only. Changing the brief clears its
                example results and any permission.
              </p>
              <Input
                id="edit-goal"
                label="Study goal"
                value={goal}
                maxLength={120}
                onChange={(event) => setGoal(event.target.value)}
                {...(errors.goal ? { error: errors.goal } : {})}
                autoFocus
              />
              <Input
                id="edit-country"
                label="Country limit"
                value={country}
                maxLength={80}
                onChange={(event) => setCountry(event.target.value)}
                {...(errors.country ? { error: errors.country } : {})}
              />
              <Input
                id="edit-budget"
                label="Annual amount (EUR)"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                hint={
                  profile.level === "phd"
                    ? "Personal top-ups per year; funding remains essential."
                    : "Total per year, including tuition and living costs."
                }
                {...(errors.budget ? { error: errors.budget } : {})}
              />
              <div className="inline-actions">
                <Button type="submit">Save changes</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    requestAnimationFrame(() =>
                      document.getElementById("edit-brief")?.focus(),
                    );
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
          {confirmed && (
            <Notice title="Brief confirmed" tone="success">
              These are your example preferences, not a confirmation of
              admission eligibility.
            </Notice>
          )}
        </>
      )}
      <div className="profile-footnote">
        <Icon name="info" size={15} />
        <p>
          A preference is different from a university requirement. Unknown never
          means eligible.
        </p>
      </div>
    </aside>
  );
}
