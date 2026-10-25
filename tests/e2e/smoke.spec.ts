import { expect, test } from "@playwright/test";

test("English-only mock check works using local requests only", async ({
  page,
  context,
}) => {
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:3100") {
      externalRequests.push(url.origin);
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto("/technical");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Technical skeleton" }),
  ).toBeVisible();
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/mock"),
  );
  await page.getByRole("button", { name: "Run mock check" }).click();
  expect((await responsePromise).status()).toBe(200);
  await expect(page.getByRole("status")).toHaveText(
    "Mock adapter is ready. No external AI or database was used.",
  );
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  await page.screenshot({
    path: ".cache/mock-skeleton-desktop.png",
    fullPage: true,
  });
});

test("mobile layout supports keyboard operation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/technical");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Run mock check" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Mock adapter is ready");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".cache/mock-skeleton-mobile.png",
    fullPage: true,
  });
});

test("invalid transport response has a safe message and can be retried", async ({
  page,
}) => {
  await page.goto("/technical");
  await page.route("**/api/mock", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true,"data":{"message":"Invented response"}}',
    }),
  );
  await page.getByRole("button", { name: "Run mock check" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "The mock check returned an unexpected response. Try again.",
  );
  await page.unroute("**/api/mock");
  await page.getByRole("button", { name: "Run mock check" }).click();
  await expect(page.getByRole("status")).toContainText("Mock adapter is ready");
});
