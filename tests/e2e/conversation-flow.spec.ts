import { test, expect, type Page } from "@playwright/test";
test.setTimeout(60000);

async function begin(page: Page, scenario = "bachelor") {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Demonstration", exact: true })
    .selectOption(scenario);
  await page.getByLabel("Invitation code").fill(process.env.TEST_INVITE_CODE!);
  await page.getByLabel("I am 18 or older.").check();
  await page
    .getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    )
    .check();
  await page
    .getByRole("button", { name: "Start demonstration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review example details", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Find programmes", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Confirm these details", exact: true })
    .click();
}
async function find(page: Page) {
  await page
    .getByRole("button", { name: "Find programmes", exact: true })
    .click();
}
test("bachelor complete flow, source details, local feedback, reload and session deletion", async ({
  page,
}) => {
  await begin(page);
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "View sources for Synthetic computing bachelor",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Sources for Synthetic computing bachelor",
    }),
  ).toContainText("not an official university source");
  await page
    .getByLabel("Optional feedback, using fictional details")
    .fill("Fictional example: clear sources.");
  await page.getByRole("button", { name: "Save local feedback" }).click();
  await expect(
    page.getByText("1 feedback item(s) saved in this session.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".flow-programme")).toHaveCount(2);
  await page.screenshot({
    path: ".cache/integration/bachelor-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "End and clear session" }).click();
  await expect(
    page.getByRole("button", { name: "Start demonstration", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  const resume = await page.request.post("/api/chat", {
    data: { action: "resume" },
  });
  expect(resume.status()).toBe(401);
});
test("master asks for a previous qualification before recommending", async ({
  page,
}) => {
  await begin(page, "master");
  await expect(
    page.getByRole("button", { name: "Find programmes", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Answer Previous qualification", exact: true })
    .click();
  const form = page.getByRole("form", {
    name: "Answer Previous qualification",
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
  await page.getByRole("button", { name: "Confirm these details" }).click();
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(1);
  await expect(page.locator(".flow-programme")).toContainText("likely met");
});
test("PhD does not promise the requested funding", async ({ page }) => {
  await begin(page, "phd");
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await page.getByRole("button", { name: "Allow this alternative" }).click();
  await expect(page.locator(".flow-programme")).toHaveCount(1);
  await expect(page.locator(".flow-alert")).toContainText("SOURCE UNVERIFIED");
  await expect(page.locator(".flow-programme")).toContainText(
    "Conditional alternative",
  );
  await page
    .getByRole("button", { name: "View sources for Synthetic computing PhD" })
    .click();
  await expect(
    page.getByRole("region", { name: "Sources for Synthetic computing PhD" }),
  ).toContainText("Unknown conditions");
  await page.screenshot({
    path: ".cache/integration/phd-desktop.png",
    fullPage: true,
  });
});
test("no-match and limited published catalogue remain honest", async ({
  page,
}) => {
  await begin(page, "no_match");
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await expect(page.locator(".flow-alert")).toContainText("NO CATALOG MATCH");
  await page.getByRole("button", { name: "End and clear session" }).click();
  await begin(page, "published");
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await expect(page.locator(".flow-alert")).toContainText(
    "No programme in this limited catalogue matches your requirements",
  );
});
test("published Psychology shows official sources and visible unknown conditions", async ({
  page,
}) => {
  await begin(page, "published");
  await page
    .getByRole("button", { name: "Edit Study field", exact: true })
    .click();
  const form = page.getByRole("form", { name: "Answer Study field" });
  await form.getByLabel("Study field", { exact: true }).fill("Psychology");
  await form.getByRole("button", { name: "Save answer", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm these details", exact: true })
    .click();
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(1);
  await expect(page.locator(".flow-programme")).toContainText(
    "Reviewed programme",
  );
  await expect(page.locator(".flow-programme")).not.toContainText(
    "Synthetic example",
  );
  await expect(page.locator(".flow-programme")).not.toContainText(
    "Fictional evidence:",
  );
  await expect(page.locator(".flow-alert")).toContainText("SOURCE UNVERIFIED");
  await page
    .getByRole("button", {
      name: "View sources for Psychology — English track (B.Sc.)",
      exact: true,
    })
    .click();
  const sources = page.getByRole("region", {
    name: "Sources for Psychology — English track (B.Sc.)",
  });
  await expect(
    sources.getByRole("heading", { name: "Official programme sources" }),
  ).toBeVisible();
  await expect(
    sources.getByRole("link", { name: "Open official source" }),
  ).toHaveCount(5);
  for (const link of await sources
    .getByRole("link", { name: "Open official source" })
    .all())
    await expect(link).toHaveAttribute("href", /^https:\/\/www\.utwente\.nl\//);
  await expect(sources).toContainText(
    "Personal living, insurance, travel and application costs not fully verified.",
  );
  await expect(sources).toContainText(
    "No confirmed programme-specific 2027 undergraduate funding award",
  );
  await expect(sources).not.toContainText("Fictional demonstration evidence");
  await page.screenshot({
    path: ".cache/publication/twente-psych-reviewed.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "End and clear session", exact: true })
    .click();
});

test("out-of-scope messages retain the profile and block unsafe instructions", async ({
  page,
}) => {
  await begin(page);
  await page
    .getByLabel("Ask about your study choices", { exact: true })
    .fill("Tell me the weather");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".flow-alert")).toContainText("OUT OF SCOPE");
  await expect(
    page.getByRole("button", { name: "Find programmes", exact: true }),
  ).toBeEnabled();
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(2);
});
test("budget conflict clears results and requires an explicit choice", async ({
  page,
}) => {
  await begin(page);
  await find(page);
  await page
    .getByLabel("Ask about your study choices", { exact: true })
    .fill("My budget is 7000 EUR");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".flow-alert")).toContainText("PROFILE CONFLICT");
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Find programmes", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Keep 10000", exact: true }).click();
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(2);
});
test("alternative requires permission, sources stay hidden before grant and after revoke", async ({
  page,
}) => {
  await begin(page, "alternative");
  await find(page);
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  expect(
    (await page.request.get("/api/programs/synthetic-over-budget")).status(),
  ).toBe(404);
  await page.screenshot({
    path: ".cache/integration/alternative-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Allow this alternative" }).click();
  await expect(page.locator(".flow-programme")).toContainText(
    "Conditional alternative",
  );
  await page
    .getByRole("button", {
      name: "View sources for Synthetic advanced computing",
    })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Sources for Synthetic advanced computing",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Withdraw alternative permission" })
    .click();
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  expect(
    (await page.request.get("/api/programs/synthetic-over-budget")).status(),
  ).toBe(404);
});
test("unavailable explanation has explicit deterministic recovery", async ({
  page,
}) => {
  await begin(page, "provider_unavailable");
  await find(page);
  await expect(page.locator(".flow-alert")).toContainText(
    "PROVIDER UNAVAILABLE",
  );
  await expect(page.locator(".flow-programme")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Browse without explanation" })
    .click();
  await expect(page.locator(".flow-programme")).toHaveCount(2);
});
test("mobile 390/320 supports the complete flow and keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await begin(page);
  await find(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.cache/integration/bachelor-mobile-${width}.png`,
      fullPage: true,
    });
  }
});
