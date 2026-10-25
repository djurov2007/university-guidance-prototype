import { test, expect, type Page, type Locator } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeEnabled();
  for (let i = 0; i < 100; i++) {
    if (await target.evaluate((el) => document.activeElement === el)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("Control not reachable by keyboard within 100 tabs");
}
async function activate(page: Page, target: Locator) {
  await tabTo(page, target);
  const outline = await target.evaluate(
    (el) => getComputedStyle(el).outlineWidth,
  );
  expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Enter");
}
async function begin(page: Page) {
  await page.goto("/");
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
}
async function audit(page: Page, stage: string, width: number) {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const result = await page.evaluate(() => {
    const unnamed = [
      ...document.querySelectorAll<HTMLInputElement>("input,select,textarea"),
    ]
      .filter((el) => el.getBoundingClientRect().width > 0 && !el.disabled)
      .filter(
        (el) =>
          !el.labels?.length &&
          !el.getAttribute("aria-label") &&
          !el.getAttribute("aria-labelledby"),
      )
      .map((el) => el.tagName + "#" + el.id);
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const luminance = (c: number[]) =>
      c
        .slice(0, 3)
        .map((n) => n / 255)
        .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4))
        .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i]!, 0);
    const contrasts: { selector: string; ratio: number; minimum: number }[] =
      [];
    for (const el of document.querySelectorAll<HTMLElement>(
      "h1,h2,h3,p,small,.flow-pill,.flow-button,.flow-status,.flow-step",
    )) {
      const style = getComputedStyle(el);
      if (
        !el.innerText.trim() ||
        !el.getBoundingClientRect().width ||
        style.opacity !== "1" ||
        el.matches(":disabled") ||
        el.closest("details:not([open])")
      )
        continue;
      let bg: HTMLElement | null = el;
      while (bg && rgb(getComputedStyle(bg).backgroundColor)[3] === 0)
        bg = bg.parentElement;
      if (!bg) continue;
      const color = rgb(style.color),
        background = rgb(getComputedStyle(bg).backgroundColor);
      // Only audit opaque solid colours; do not report guessed alpha/gradient contrast.
      if (
        (color[3] ?? 1) !== 1 ||
        (background[3] ?? 1) !== 1 ||
        getComputedStyle(bg).backgroundImage !== "none"
      )
        continue;
      const a = luminance(color),
        b = luminance(background);
      const size = parseFloat(style.fontSize),
        bold = parseInt(style.fontWeight) >= 700;
      contrasts.push({
        selector: el.tagName + "." + el.className,
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        minimum: size >= 24 || (bold && size >= 18.66) ? 3 : 4.5,
      });
    }
    return {
      unnamed,
      contrasts,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  expect(result.unnamed).toEqual([]);
  expect(result.overflow).toBe(false);
  // Seven eligible text elements at the mobile gate; later states have many more.
  expect(result.contrasts.length).toBeGreaterThanOrEqual(7);
  expect(result.contrasts.filter((c) => c.ratio < c.minimum)).toEqual([]);
  mkdirSync(".cache/testing", { recursive: true });
  writeFileSync(
    `.cache/testing/a11y-${width}-${stage}.json`,
    JSON.stringify(result, null, 2),
  );
  await page.screenshot({
    path: `.cache/testing/qa-${width}-${stage}.png`,
    fullPage: true,
  });
}

for (const width of [320, 390, 1280]) {
  test(`basic accessibility, contrast and overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await audit(page, "gate", width);
    await begin(page);
    await page
      .getByRole("button", { name: "Review example details", exact: true })
      .click();
    await audit(page, "profile", width);
    await page
      .getByRole("button", { name: "Confirm these details", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Find programmes", exact: true })
      .click();
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
        exact: true,
      }),
    ).toBeVisible();
    await audit(page, "results", width);
    await page
      .getByRole("button", { name: "End and clear session", exact: true })
      .click();
  });
}
test("keyboard-only invitation, skip link, confirmation, search, sources and deletion", async ({
  page,
}) => {
  await page.goto("/");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await tabTo(page, page.getByLabel("Invitation code"));
  await page.keyboard.type(process.env.TEST_INVITE_CODE!);
  await tabTo(page, page.getByLabel("I am 18 or older."));
  await page.keyboard.press("Space");
  await tabTo(
    page,
    page.getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    ),
  );
  await page.keyboard.press("Space");
  for (const name of [
    "Start demonstration",
    "Review example details",
    "Confirm these details",
    "Find programmes",
  ]) {
    await activate(page, page.getByRole("button", { name, exact: true }));
  }
  await expect(page.locator(".flow-programme")).toHaveCount(2);
  await activate(
    page,
    page.getByRole("button", {
      name: "View sources for Synthetic computing bachelor",
      exact: true,
    }),
  );
  await expect(
    page.getByRole("region", {
      name: "Sources for Synthetic computing bachelor",
      exact: true,
    }),
  ).toBeVisible();
  await activate(
    page,
    page.getByRole("button", { name: "End and clear session", exact: true }),
  );
  await expect(page.getByLabel("Invitation code")).toBeVisible();
});
