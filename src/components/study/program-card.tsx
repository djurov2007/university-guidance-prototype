import { useState } from "react";
import type { DemoProgram } from "@/test-fixtures/ui-demo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SourceDetails } from "./source-details";

export function ProgramCard({
  program,
  index,
}: {
  program: DemoProgram;
  index: number;
}) {
  const [nextOpen, setNextOpen] = useState(false);
  return (
    <article
      className={`program-card ${program.conditional ? "program-conditional" : ""}`}
      aria-labelledby={`${program.id}-title`}
      data-testid="program-card"
    >
      <div className="program-top">
        <span className="option-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`badge ${program.conditional ? "badge-warning" : "badge-info"}`}
        >
          {program.conditional ? "Conditional example" : "Illustrative option"}
        </span>
      </div>
      <p className="eyebrow">{program.level}</p>
      <h3 id={`${program.id}-title`}>{program.title}</h3>
      <p className="program-institution">
        Fictional institution · not a real university
      </p>
      <div className="program-meta">
        <span>
          <Icon name="globe" size={15} />
          {program.country}
        </span>
        <span>{program.language}</span>
      </div>
      <div className="why">
        <span className="tiny-label">Why it’s shown</span>
        <p>{program.reason}</p>
      </div>
      <dl className="program-facts">
        <div>
          <dt>Example costs</dt>
          <dd>{program.cost}</dd>
        </div>
        <div>
          <dt>Needs verification</dt>
          <dd>{program.unknown}</dd>
        </div>
      </dl>
      <SourceDetails sourceId={program.sourceId} />
      <Button
        variant="secondary"
        className="next-button"
        aria-expanded={nextOpen}
        aria-controls={`${program.id}-next`}
        onClick={() => setNextOpen(!nextOpen)}
      >
        {nextOpen ? "Hide next step" : "View next step"}
        <Icon name="arrow" size={16} />
      </Button>
      {nextOpen && (
        <div id={`${program.id}-next`} className="next-step">
          <strong>Your next step</strong>
          <p>{program.nextStep}</p>
          <p className="fine-print">
            For a real option, use its verified official page. This example has
            no live application link.
          </p>
        </div>
      )}
    </article>
  );
}
