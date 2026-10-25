import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3100";
const invitation = () => ({
  code: process.env.TEST_INVITE_CODE!,
  adult: true,
  privacyNoticeAccepted: true,
  noticeVersion: "synthetic-privacy-1",
  scenario: "bachelor",
});
test("invitation gate, CSP and disabled documents survive real browser hydration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto("/");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("'nonce-");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  await expect(
    page.getByText("Real PDF upload is disabled.", { exact: false }).first(),
  ).toBeVisible();
  const start = page.getByRole("button", {
    name: "Start demonstration",
    exact: true,
  });
  await expect(start).toBeDisabled();
  await page.getByLabel("Invitation code").fill(process.env.TEST_INVITE_CODE!);
  await expect(start).toBeDisabled();
  await page.getByLabel("I am 18 or older.").check();
  await expect(start).toBeDisabled();
  await page
    .getByLabel(
      "I accept the privacy notice above and will use fictional details only.",
    )
    .check();
  await expect(start).toBeEnabled();
  await page.screenshot({
    path: ".cache/security/invitation-desktop.png",
    fullPage: true,
  });
  await start.click();
  await expect(
    page.getByRole("button", { name: "Review example details", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "study_demo_session",
  );
  expect(errors).toEqual([]);
  const again = await page.goto("/");
  expect(again?.headers()["content-security-policy"]).not.toBe(csp);
  await page.getByRole("button", { name: "End and clear session" }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".cache/security/invitation-mobile.png",
    fullPage: true,
  });
});
test("anonymous, cross-site and forged requests cannot bootstrap a profile or upload", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/chat", {
        data: { action: "start", scenario: "bachelor" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/session/redeem", {
        headers: { Origin: "https://evil.example" },
        data: invitation(),
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/session/redeem", {
        data: { ...invitation(), adult: false },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/upload", { data: "%PDF-1.7 fictional" })
    ).status(),
  ).toBe(403);
  const policy = await (await request.get("/api/security/policy")).json();
  expect(policy.policy.uploadEnabled).toBe(false);
  expect(policy.policy.liveAiEnabled).toBe(false);
  expect(
    (
      await request.post("/api/chat", {
        headers: { Cookie: `study_demo_session=${"x".repeat(43)}` },
        data: { action: "resume" },
      })
    ).status(),
  ).toBe(401);
});
test("independent browser contexts cannot select another session with a body ID", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  try {
    const redeem = (context: typeof a) =>
      context.request.post(origin + "/api/session/redeem", {
        headers: { Origin: origin },
        data: invitation(),
      });
    expect((await redeem(a)).status()).toBe(200);
    expect((await redeem(b)).status()).toBe(200);
    const token = (await a.cookies())[0]!.value;
    expect(
      (
        await b.request.post(origin + "/api/chat", {
          headers: { Origin: origin },
          data: { action: "resume", sessionId: token },
        })
      ).status(),
    ).toBe(400);
    const resume = (context: typeof a) =>
      context.request.post(origin + "/api/chat", {
        headers: { Origin: origin },
        data: { action: "resume" },
      });
    expect((await resume(a)).status()).toBe(200);
    expect((await resume(b)).status()).toBe(200);
    expect(
      (
        await a.request.delete(origin + "/api/session", {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(200);
    expect((await resume(a)).status()).toBe(401);
    expect((await resume(b)).status()).toBe(200);
  } finally {
    await a.close();
    await b.close();
  }
});

test("public synthetic diagnostic still rejects cross-site and oversized JSON", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/mock", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/mock", { data: { message: "x".repeat(40001) } })
    ).status(),
  ).toBe(413);
});
