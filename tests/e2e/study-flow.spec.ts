import { expect, test, type Page } from "@playwright/test";
import { scenarios } from "../../src/test-fixtures/ui-demo";

async function chooseScene(page: Page, scene: string) {
  const picker = page.getByText("Preview scenarios", { exact: false });
  if ((await page.locator(".scenario-picker").getAttribute("open")) === null)
    await picker.click();
  await page.getByLabel("Show a UI state").selectOption(scene);
  await expect(page.locator("main")).toHaveAttribute("data-scene", scene);
  await page.locator(".scenario-picker summary").click();
}

test("synthetic undergraduate walkthrough reaches sources and a next step with no API calls", async ({
  page,
  context,
}) => {
  const violations: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== "http://127.0.0.1:3100" ||
      url.pathname.startsWith("/api/")
    ) {
      violations.push(url.origin + url.pathname);
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto("/preview");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Synthetic demo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Bachelor’s", exact: true }).click();
  await expect(
    page.getByRole("definition").filter({ hasText: "Not provided yet" }),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Use these example details" }).click();
  await expect(
    page.getByRole("button", { name: "Explore example options" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await page.getByRole("button", { name: "Explore example options" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(1);
  await page.getByText("Sources & checks", { exact: false }).click();
  await expect(page.getByText("None — fictional reference")).toBeVisible();
  await expect(page.getByText("05 Oct 2026", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View next step" }).click();
  await expect(page.getByText("Your next step", { exact: true })).toBeVisible();
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
  await expect(
    page.getByRole("link", { name: "Skip to study workspace" }),
  ).toHaveCSS("opacity", "0");
  await page.screenshot({ path: ".cache/ui/desktop-flow.png", fullPage: true });
  await page.reload();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await expect(
    page.getByText("Secondary school completed · Serbia"),
  ).toHaveCount(0);
});

test("edited data clears results; invalid amounts have an accessible error", async ({
  page,
}) => {
  await page.goto("/preview");
  await chooseScene(page, "one");
  await page.getByRole("button", { name: "Edit brief", exact: true }).click();
  await page.getByLabel("Annual amount (EUR)").fill("-1");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByLabel("Annual amount (EUR)")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Annual amount (EUR)")).toBeFocused();
  await page.getByLabel("Annual amount (EUR)").fill("1000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await expect(
    page
      .getByRole("definition")
      .filter({ hasText: "EUR 1,000 / year · total" }),
  ).toBeVisible();
  await expect(
    page.getByText("This fixed walkthrough cannot recalculate", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore example options" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit brief", exact: true }),
  ).toBeFocused();
  await chooseScene(page, "server-error");
  await expect(
    page
      .getByRole("definition")
      .filter({ hasText: "EUR 1,000 / year · total" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page
      .getByRole("definition")
      .filter({ hasText: "EUR 1,000 / year · total" }),
  ).toBeVisible();
  await chooseScene(page, "ai-unavailable");
  await expect(
    page.getByRole("button", { name: "Review example options" }),
  ).toBeDisabled();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
});

test("alternative remains absent before permission, after No, after withdrawal and after editing", async ({
  page,
}) => {
  await page.goto("/preview");
  await chooseScene(page, "conditional");
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await expect(
    page.getByText("Economics & project learning · example", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "No, keep my limit" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await expect(
    page.getByRole("definition").filter({ hasText: "Germany only" }),
  ).toBeVisible();
  await chooseScene(page, "permission");
  await page.getByRole("button", { name: "Yes, explore Italy" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(1);
  await expect(
    page.getByRole("definition").filter({ hasText: "Germany only" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".cache/ui/desktop-alternative.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Withdraw permission" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Yes, explore Italy" }).click();
  await page.getByRole("button", { name: "Edit brief", exact: true }).click();
  await page.getByLabel("Country limit").fill("Serbia only");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Withdraw permission" }),
  ).toHaveCount(0);
});

test("all intentional states render; card counts and expired data stay correct", async ({
  page,
}) => {
  await page.goto("/preview");
  for (const [scene] of scenarios) {
    await chooseScene(page, scene);
    const expected =
      scene === "recommendations"
        ? 3
        : scene === "two"
          ? 2
          : scene === "one" || scene === "unverified"
            ? 1
            : 0;
    await expect(page.getByTestId("program-card")).toHaveCount(expected);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (
      [
        "welcome",
        "loading",
        "conflict",
        "recommendations",
        "permission",
        "unverified",
        "server-error",
        "expired",
        "empty-catalog",
      ].includes(scene)
    )
      await page.screenshot({
        path: `.cache/ui/desktop-${scene}.png`,
        fullPage: true,
      });
    if (scene === "expired") {
      await expect(page.locator(".messages")).toHaveCount(0);
      await expect(page.locator(".profile-fields")).toHaveCount(0);
      await expect(page.locator("#study-message")).toHaveCount(0);
    }
  }
});

test("master and PhD examples use different questions and funding states", async ({
  page,
}) => {
  await page.goto("/preview");
  await page.getByRole("button", { name: "Master’s", exact: true }).click();
  await expect(
    page.getByText("What relevant degree and credits", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use these example details" }).click();
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await page.getByRole("button", { name: "Explore example options" }).click();
  await expect(page.getByTestId("program-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await page.getByRole("button", { name: "PhD", exact: true }).click();
  await expect(
    page.getByText("What research experience", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use these example details" }).click();
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await page.getByRole("button", { name: "Explore example options" }).click();
  await expect(
    page.getByText("Funding not confirmed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Conditional example", { exact: true }),
  ).toBeVisible();
});

test("mobile panels support the full flow and all scenarios at 390 and 320 pixels", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview");
  await page.getByRole("button", { name: "Bachelor’s", exact: true }).click();
  await page.getByRole("button", { name: "Use these example details" }).click();
  await expect(
    page.getByRole("heading", { name: "Your study brief" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm brief", exact: true })
    .click();
  await page.getByRole("button", { name: "Conversation", exact: true }).click();
  await page.getByRole("button", { name: "Explore example options" }).click();
  await expect(page.getByTestId("program-card")).toBeVisible();
  await page.screenshot({
    path: ".cache/ui/mobile-options.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [scene] of scenarios) {
      await chooseScene(page, scene);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      if (
        ["welcome", "partial", "conflict", "permission", "expired"].includes(
          scene,
        )
      ) {
        if (scene === "conflict")
          await page
            .getByRole("button", { name: "Study brief", exact: true })
            .click();
        await page.screenshot({
          path: `.cache/ui/mobile-${width}-${scene}.png`,
          fullPage: true,
        });
      }
    }
  }
});

test("keyboard has a visible skip link, focus and operable native controls", async ({
  page,
}) => {
  await page.goto("/preview");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to study workspace" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Skip to study workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Skip to study workspace" }),
  ).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Bachelor’s", exact: true }),
  ).toBeFocused();
  const focus = await page
    .getByRole("button", { name: "Bachelor’s", exact: true })
    .evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(focus).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Use these example details" }),
  ).toBeVisible();
});
