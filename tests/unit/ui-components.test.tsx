import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Notice } from "@/components/ui/notice";
import { Input } from "@/components/ui/input";
import { ProgramCard } from "@/components/study/program-card";
import { ProfilePanel } from "@/components/study/profile-panel";
import { StudyWorkspace } from "@/components/study/study-workspace";
import { ConversationWorkspace } from "@/components/conversation/conversation-workspace";
import { examplePrograms, makeProfile } from "@/test-fixtures/ui-demo";

describe("UI component contracts", () => {
  it("identifies a live error with text and alert semantics", () => {
    const html = renderToStaticMarkup(
      <Notice title="Something went wrong" tone="error" live>
        Please try again.
      </Notice>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Please try again.");
  });

  it("connects an input label and actionable error without relying on color", () => {
    const html = renderToStaticMarkup(
      <Input
        id="budget"
        label="Annual amount (EUR)"
        error="Enter a positive annual amount."
      />,
    );
    expect(html).toContain('for="budget"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="budget-error"');
    expect(html).toContain('id="budget-error"');
  });

  it("labels fictional programs and simulated sources; invents no live university URL", () => {
    const html = renderToStaticMarkup(
      <ProgramCard program={examplePrograms("undergraduate")[0]!} index={0} />,
    );
    expect(html).toContain("Fictional institution");
    expect(html).toContain("Fictional source");
    expect(html).toContain("simulated");
    expect(html).toContain("Needs verification");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("Admission score");
  });

  it("does not describe a PhD example as confirmed funding or an open position", () => {
    const html = renderToStaticMarkup(
      <ProgramCard program={examplePrograms("phd")[0]!} index={0} />,
    );
    expect(html).toContain("Conditional example");
    expect(html).toContain("Funding not confirmed");
    expect(html).toContain("has not been established");
  });

  it("preserves unknown fields and prevents confirmation of an incomplete profile", () => {
    const html = renderToStaticMarkup(
      <ProfilePanel
        profile={makeProfile("undergraduate", true)}
        empty={false}
        onSave={() => {}}
        onConfirm={() => {}}
        onResolve={() => {}}
      />,
    );
    expect(html).toContain("Not provided yet");
    expect(html).toContain("Unknown");
    expect(html).toMatch(/disabled=""[^>]*>Confirm brief/);
  });

  it("escapes untrusted display text instead of executing it", () => {
    const program = {
      ...examplePrograms("undergraduate")[0]!,
      title: '<img src=x onerror="alert(1)">',
    };
    const html = renderToStaticMarkup(
      <ProgramCard program={program} index={0} />,
    );
    expect(html).toContain("&lt;img");
    expect(html).not.toContain('<img src="x"');
  });

  it("starts with a synthetic disclosure and no option cards or saved profile", () => {
    const html = renderToStaticMarkup(<StudyWorkspace />);
    expect(html).toContain("Synthetic demo");
    expect(html).toContain("All profiles, programs and sources are fictional");
    expect(html).toContain("Skip to study workspace");
    expect(html).not.toContain('data-testid="program-card"');
    expect(html).not.toContain("Secondary school completed");
  });

  it("labels the hosted mock as a controlled preview with accurate storage copy", () => {
    const html = renderToStaticMarkup(<ConversationWorkspace remotePreview />);
    expect(html).toContain("Controlled preview");
    expect(html).toContain(
      "This controlled preview uses simulated explanations",
    );
    expect(html).toContain("stored temporarily on this preview service");
    expect(html).not.toContain("stored temporarily on this computer");
  });
});
