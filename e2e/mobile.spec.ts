import { expect, test } from "@playwright/test";

test("mobile: no horizontal overflow and the floating button reaches the preview", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: /Lihat Prompt/ }).click();
  await expect(page.locator("#output")).toBeInViewport();
  expect(errors).toEqual([]);
});
