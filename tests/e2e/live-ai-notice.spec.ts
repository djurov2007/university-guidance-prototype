import { test, expect } from "@playwright/test";

test("AI notice, consent version and blocked live gate survive browser hydration", async ({
  page,
  request,
}) => {
  const externalAi = process.env.PLAYWRIGHT_AI_NOTICE === "openai";
  await page.goto("/");
  const notice = page.locator(".flow-notice");
  await expect(notice).toContainText(
    externalAi ? "sends your fictional messages" : "simulated explanations",
  );
  if (externalAi)
    await expect(notice).toContainText("20 API attempts or USD 0.25");
  const policy = (await (await request.get("/api/security/policy")).json())
    .policy;
  expect(policy.liveAiEnabled).toBe(false);
  expect(policy.externalAi).toBe(externalAi);
  await page.getByLabel("Invitation code").fill(process.env.TEST_INVITE_CODE!);
  await page.getByLabel("I am 18 or older.").check();
  await page
    .getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    )
    .check();
  const redemption = page.waitForRequest("**/api/session/redeem");
  await page
    .getByRole("button", { name: "Start demonstration", exact: true })
    .click();
  expect((await redemption).postDataJSON().noticeVersion).toBe(
    externalAi ? "synthetic-openai-1" : "synthetic-privacy-1",
  );
  await expect(
    page.getByRole("button", { name: "Review example details", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (externalAi) {
    // This configuration deliberately has no live approval: no external request.
    await page
      .getByRole("textbox", {
        name: "Ask about your study choices",
        exact: true,
      })
      .fill("My study budget is 9000 EUR");
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(page.locator(".flow-alert")).toContainText(
      "Live AI is disabled",
    );
  }
  await page.screenshot({
    path: `.cache/live-api/${externalAi ? "openai" : "mock"}-notice-mobile.png`,
    fullPage: true,
  });
});
