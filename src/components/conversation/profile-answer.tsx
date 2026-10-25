"use client";
import { useState, type FormEvent } from "react";
import { profileValueSchemas, type FieldKey } from "@/features/profiles/schema";

export const fieldLabels: Record<FieldKey, string> = {
  studyLevel: "Study level",
  fieldOfStudy: "Study field",
  interests: "Interests",
  studyGoal: "Study goal",
  preferredCountries: "Preferred countries",
  excludedCountries: "Excluded countries",
  teachingLanguages: "Teaching languages",
  budgetAmount: "Budget amount",
  budgetCurrency: "Budget currency",
  budgetPeriod: "Budget period",
  budgetIncludesLiving: "Include living costs",
  scholarshipNeed: "Scholarship need",
  startYear: "Start year",
  previousQualification: "Previous qualification",
  relevantSubjects: "Relevant subjects",
  languageResults: "Language results",
  professionalExperience: "Work experience",
  researchExperience: "Research experience",
  orientation: "Study style",
  masterIntent: "Master's goal",
  phdTopic: "Research topic",
  phdFunding: "PhD funding",
  phdPositionType: "PhD position",
  phdFocus: "PhD focus",
  researchProposal: "Research proposal",
  hardConstraints: "Firm requirements",
  flexiblePreferences: "Flexible preferences",
};
const choices: Partial<Record<FieldKey, string[]>> = {
  studyLevel: ["undergraduate", "master", "phd"],
  budgetCurrency: ["EUR", "RSD", "USD", "GBP", "CHF"],
  budgetPeriod: ["year", "month", "total_degree"],
  budgetIncludesLiving: ["yes", "no"],
  scholarshipNeed: ["required", "preferred", "not_needed"],
  orientation: ["academic", "practical", "balanced", "unsure"],
  masterIntent: [
    "specialisation",
    "change_field",
    "research_preparation",
    "unsure",
  ],
  phdFunding: ["fully_funded", "partly_funded", "self_funded", "either"],
  phdPositionType: [
    "employed_position",
    "scholarship_position",
    "open_program",
    "either",
  ],
  phdFocus: ["supervisor", "project", "institution", "no_preference"],
  researchProposal: ["ready", "draft", "not_started", "none"],
};
const arrayFields = [
  "interests",
  "preferredCountries",
  "excludedCountries",
  "teachingLanguages",
  "professionalExperience",
  "researchExperience",
  "flexiblePreferences",
];
export function readable(value: unknown): string {
  if (value === null || value === undefined) return "Not answered";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value))
    return value.length ? value.map(readable).join(", ") : "None";
  if (typeof value === "object")
    return Object.entries(value)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${readable(v)}`)
      .join(" · ");
  return String(value).replaceAll("_", " ");
}
const countries =
  "Use country codes such as DE, NL or FR, separated by commas. EU countries and RS are supported.";
export function ProfileAnswer({
  field,
  value,
  disabled,
  onSave,
}: {
  field: FieldKey;
  value: unknown;
  disabled: boolean;
  onSave: (value: unknown) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const existing =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const id = `answer-${field}`;
  const select = (
    name: string,
    label: string,
    options: string[],
    initial?: unknown,
  ) => (
    <label>
      {label}
      <select
        name={name}
        defaultValue={typeof initial === "string" ? initial : ""}
        required
      >
        <option value="">Choose an answer</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {readable(option)}
          </option>
        ))}
      </select>
    </label>
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    let answer: unknown = text("value");
    if (["budgetAmount", "startYear"].includes(field)) answer = Number(answer);
    if (field === "budgetIncludesLiving") answer = answer === "yes";
    if (arrayFields.includes(field))
      answer =
        text("value").toLowerCase() === "none"
          ? []
          : text("value")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
    if (["preferredCountries", "excludedCountries"].includes(field))
      answer = (answer as string[]).map((v) => v.toUpperCase());
    if (field === "previousQualification")
      answer = {
        kind: text("kind"),
        field: text("subject"),
        institution: null,
        country: text("country").toUpperCase(),
        completion: text("completion"),
        completionYear: text("year") ? Number(text("year")) : null,
        credits: text("credits")
          ? {
              amount: Number(text("credits")),
              system: "ECTS",
              label: "Self-reported ECTS",
            }
          : null,
      };
    if (field === "hardConstraints")
      answer = {
        countries: text("countries"),
        languages: text("languages"),
        budget: text("budget"),
        other: text("other")
          ? text("other")
              .split(",")
              .map((v) => v.trim())
          : [],
      };
    if (field === "relevantSubjects")
      answer =
        text("value").toLowerCase() === "none"
          ? []
          : text("value")
              .split(",")
              .map((name) => ({
                name: name.trim(),
                result: null,
                credits: null,
              }));
    if (field === "languageResults")
      answer =
        text("test").toLowerCase() === "none"
          ? []
          : [
              {
                language: text("language"),
                test: text("test"),
                overall: text("score") ? Number(text("score")) : null,
                scale: text("scale") || null,
                takenOn: text("date") || null,
                note: null,
              },
            ];
    const parsed = profileValueSchemas[field].safeParse(answer);
    if (!parsed.success) {
      setError(
        "Please check this answer. Use the requested format and leave unknown optional details blank.",
      );
      return;
    }
    setError("");
    await onSave(parsed.data);
  }
  return (
    <form
      className="answer-form"
      onSubmit={submit}
      aria-label={`Answer ${fieldLabels[field]}`}
    >
      <fieldset disabled={disabled}>
        <legend className="sr-only">{fieldLabels[field]}</legend>
        {field === "previousQualification" ? (
          <>
            {select(
              "kind",
              "Qualification type",
              ["secondary", "bachelor", "master", "integrated_degree", "other"],
              existing.kind,
            )}
            <label>
              Qualification subject
              <input
                name="subject"
                defaultValue={String(existing.field ?? "")}
                maxLength={200}
                required
              />
            </label>
            <label>
              Qualification country
              <input
                name="country"
                defaultValue={String(existing.country ?? "")}
                maxLength={2}
                placeholder="RS"
                required
              />
            </label>
            {select(
              "completion",
              "Completion",
              ["completed", "in_progress"],
              existing.completion,
            )}
            <label>
              Completion year (optional)
              <input
                name="year"
                type="number"
                min="1900"
                max="2100"
                defaultValue={String(existing.completionYear ?? "")}
              />
            </label>
            <label>
              ECTS credits (optional)
              <input
                name="credits"
                type="number"
                min="0"
                max="10000"
                defaultValue={String(
                  (existing.credits as { amount?: number } | null)?.amount ??
                    "",
                )}
              />
            </label>
            <p className="answer-hint">
              Self-reported details. Institution recognition must be checked
              separately. Do not enter a name or personal identifiers.
            </p>
          </>
        ) : field === "hardConstraints" ? (
          <>
            {select(
              "countries",
              "Country requirement",
              ["only_preferred", "any_in_scope"],
              existing.countries,
            )}
            {select(
              "languages",
              "Language requirement",
              ["only_listed", "flexible"],
              existing.languages,
            )}
            {select(
              "budget",
              "Budget requirement",
              ["hard_maximum", "target"],
              existing.budget,
            )}
            <label>
              Other firm requirements (comma-separated, optional)
              <input
                name="other"
                defaultValue={
                  Array.isArray(existing.other) ? existing.other.join(", ") : ""
                }
                maxLength={500}
              />
            </label>
          </>
        ) : field === "languageResults" ? (
          <>
            <label>
              Language
              <input name="language" placeholder="English" maxLength={100} />
            </label>
            <label>
              Test name, or none
              <input
                name="test"
                placeholder="IELTS, or none"
                maxLength={100}
                required
              />
            </label>
            <label>
              Overall score (optional)
              <input name="score" type="number" step="any" min="0" />
            </label>
            <label>
              Score scale (optional)
              <input name="scale" placeholder="0–9" maxLength={100} />
            </label>
            <label>
              Test date (optional)
              <input name="date" type="date" />
            </label>
          </>
        ) : choices[field] ? (
          <label htmlFor={id}>
            {fieldLabels[field]}
            <select
              id={id}
              name="value"
              defaultValue={
                field === "budgetIncludesLiving" && typeof value === "boolean"
                  ? value
                    ? "yes"
                    : "no"
                  : typeof value === "string"
                    ? value
                    : ""
              }
              required
            >
              <option value="">Choose an answer</option>
              {choices[field]!.map((option) => (
                <option key={option} value={option}>
                  {option === "undergraduate" ? "Bachelor's" : readable(option)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label htmlFor={id}>
            {fieldLabels[field]}
            <input
              id={id}
              name="value"
              type={
                ["budgetAmount", "startYear"].includes(field)
                  ? "number"
                  : "text"
              }
              min="0"
              maxLength={500}
              defaultValue={
                Array.isArray(value)
                  ? value
                      .map((v) =>
                        typeof v === "string"
                          ? v
                          : ((v as { name?: string }).name ?? ""),
                      )
                      .join(", ")
                  : typeof value === "string" || typeof value === "number"
                    ? value
                    : ""
              }
              required
            />
          </label>
        )}
        {["preferredCountries", "excludedCountries"].includes(field) && (
          <p className="answer-hint">{countries}</p>
        )}
        {(arrayFields.includes(field) || field === "relevantSubjects") && (
          <p className="answer-hint">
            Separate entries with commas. Enter “none” for an empty list.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <button className="flow-button small" type="submit">
          Save answer
        </button>
      </fieldset>
    </form>
  );
}
