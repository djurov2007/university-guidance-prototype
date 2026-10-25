import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

test("seven synthetic demo profiles, real backup recording and explicit recovery", async ({
  browser,
}) => {
  test.setTimeout(180000);
  mkdirSync("docs/demo/assets", { recursive: true });
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3100",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3100" },
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: ".cache/demo-recording",
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const externalRequests: string[] = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:3100") {
      externalRequests.push(url.origin);
      await route.abort();
    } else await route.continue();
  });
  const video = page.video()!;
  const observations: string[] = [];
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  const show = async (id: string, note: string) => {
    observations.push(id + ": " + note);
    await page.screenshot({
      path: `docs/demo/assets/${id}.png`,
      fullPage: true,
    });
    await page.waitForTimeout(4000);
  };
  const begin = async (scenario: string) => {
    await page.goto("/");
    await page
      .getByRole("combobox", { name: "Demonstration", exact: true })
      .selectOption(scenario);
    await page
      .getByLabel("Invitation code")
      .fill(process.env.TEST_INVITE_CODE!);
    await page.getByLabel("I am 18 or older.").check();
    await page
      .getByLabel(
        "I accept the privacy notice above and will use fictional details only.",
      )
      .check();
    await button("Start demonstration").click();
    await expect(
      page.getByRole("region", { name: "Study conversation" }),
    ).toBeVisible();
  };
  const prepare = async () => {
    await button("Review example details").click();
    await button("Confirm these details").click();
  };
  const search = async (count: number) => {
    await button("Find programmes").click();
    await expect(page.locator(".flow-programme")).toHaveCount(count);
  };
  const answer = async (label: string, value: string) => {
    await button("Answer " + label)
      .or(button("Edit " + label))
      .click();
    const form = page.getByRole("form", {
      name: "Answer " + label,
      exact: true,
    });
    await form.getByLabel(label, { exact: true }).fill(value);
    await form
      .getByRole("button", { name: "Save answer", exact: true })
      .click();
    await button("Confirm these details").click();
  };
  const sources = async (name: string) => {
    await button("View sources for " + name).click();
    const region = page.getByRole("region", {
      name: "Sources for " + name,
      exact: true,
    });
    await expect(region).toContainText("not an official university source");
    await expect(region).toContainText("2026-10-");
    await region.scrollIntoViewIfNeeded();
  };
  try {
    await begin("bachelor");
    await expect(button("Find programmes")).toBeDisabled();
    await show(
      "01-questions",
      "Incomplete profile has staged questions, no assumed answers",
    );
    await prepare();
    await search(2);
    await sources("Synthetic computing bachelor");
    await show(
      "02-bachelor-sources",
      "Two cards, synthetic source/check date and concrete next step",
    );
    await answer("Budget amount", "11000");
    await expect(page.locator(".flow-programme")).toHaveCount(0);
    await search(2);
    await page
      .getByLabel("Ask about your study choices", { exact: true })
      .fill("Tell me the weather");
    await button("Send message").click();
    await expect(page.locator(".flow-alert")).toContainText("OUT OF SCOPE");
    await show(
      "03-out-of-scope",
      "Correction confirmed; unrelated message cannot change profile",
    );
    await button("End and clear session").click();

    await begin("master");
    await prepare();
    await expect(button("Find programmes")).toBeDisabled();
    await button("Answer Previous qualification").click();
    const form = page.getByRole("form", {
      name: "Answer Previous qualification",
      exact: true,
    });
    await form
      .getByRole("combobox", { name: "Qualification type", exact: true })
      .selectOption("bachelor");
    await form.getByLabel("Qualification subject").fill("Computer science");
    await form.getByLabel("Qualification country").fill("RS");
    await form
      .getByRole("combobox", { name: "Completion", exact: true })
      .selectOption("completed");
    await form.getByLabel("Completion year (optional)").fill("2026");
    await form.getByLabel("ECTS credits (optional)").fill("180");
    await form.getByRole("button", { name: "Save answer" }).click();
    await button("Confirm these details").click();
    await search(1);
    await expect(page.locator(".flow-programme")).toContainText(
      "Algorithms, Linear algebra",
    );
    await expect(page.locator(".flow-programme")).toContainText("unknown");
    await show(
      "04-master-unknown",
      "Missing prerequisite subjects remain unknown",
    );
    await answer("Relevant subjects", "none");
    await search(0);
    await expect(page.locator(".flow-alert")).toContainText("NO CATALOG MATCH");
    await answer("Relevant subjects", "Algorithms, Linear algebra");
    await search(1);
    await expect(page.locator(".flow-programme")).toContainText("likely met");
    await sources("Synthetic computing master");
    await show(
      "05-master-subjects",
      "Self-reported prerequisites are likely met, institution must confirm",
    );
    await button("End and clear session").click();

    await begin("phd");
    await prepare();
    await search(0);
    await button("Allow this alternative").click();
    await expect(page.locator(".flow-programme")).toHaveCount(1);
    await expect(page.locator(".flow-programme")).toContainText(
      "Conditional alternative",
    );
    await sources("Synthetic computing PhD");
    await show(
      "06-phd-funding",
      "Funding, supervisor and employment remain unknown after scoped permission",
    );
    await button("End and clear session").click();

    await begin("no_match");
    await prepare();
    await search(0);
    await expect(page.locator(".flow-alert")).toContainText("NO CATALOG MATCH");
    await show(
      "07-no-match",
      "Limited catalogue has no relevant option, no fabrication",
    );
    await button("End and clear session").click();

    await begin("alternative");
    await prepare();
    await search(0);
    await show(
      "08-alternative-hidden",
      "Programme identity hidden until specific permission",
    );
    await button("Allow this alternative").click();
    await expect(page.locator(".flow-programme")).toHaveCount(1);
    await sources("Synthetic advanced computing");
    await show(
      "09-alternative-permitted",
      "Above-budget option is conditional, budget remains 10000 EUR",
    );
    await button("Withdraw alternative permission").click();
    await expect(page.locator(".flow-programme")).toHaveCount(0);
    await button("End and clear session").click();

    await begin("bachelor");
    await prepare();
    await search(2);
    await page
      .getByLabel("Ask about your study choices", { exact: true })
      .fill("My budget is 7000 EUR");
    await button("Send message").click();
    await expect(page.locator(".flow-alert")).toContainText("PROFILE CONFLICT");
    await expect(button("Find programmes")).toBeDisabled();
    await show(
      "10-conflict",
      "Both budget candidates preserved; old cards removed",
    );
    await button("Keep 10000").click();
    await search(2);
    await button("End and clear session").click();

    await begin("provider_unavailable");
    await prepare();
    await search(0);
    await expect(page.locator(".flow-alert")).toContainText(
      "PROVIDER UNAVAILABLE",
    );
    await show(
      "11-provider-failure",
      "Failure stops explanation, no silent fallback",
    );
    await button("Browse without explanation").click();
    await expect(page.locator(".flow-programme")).toHaveCount(2);
    await page.locator(".flow-results").scrollIntoViewIfNeeded();
    await show(
      "12-deterministic-recovery",
      "Explicit deterministic recovery with same constraints and sources",
    );
    await button("End and clear session").click();
    await expect(page.getByLabel("Invitation code")).toHaveValue("");
    expect(externalRequests).toEqual([]);
  } finally {
    await context.close();
    await video.saveAs("docs/demo/assets/demo-backup.webm");
  }
  writeFileSync(
    ".cache/demo-recording/rehearsal-result.json",
    JSON.stringify(
      {
        date: "2026-10-11",
        recordedAt: new Date().toISOString(),
        synthetic: true,
        provider: "mock",
        profiles: 7,
        observations,
        passed: true,
      },
      null,
      2,
    ),
  );
});
