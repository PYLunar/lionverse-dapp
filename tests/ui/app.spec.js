import { test, expect } from "@playwright/test";
import { expectEnglish } from "./english.js";

test.use({ locale: "zh-CN" });
test("shows founder probabilities and a wallet-based collection without demo data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Founder mint probabilities")).toContainText("60%");
  await expect(page.getByLabel("Founder mint probabilities")).toContainText("30%");
  await expect(page.getByLabel("Founder mint probabilities")).toContainText("10%");
  await expect(page.getByRole("heading", { name: "The Night Keeper" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Light Chaser" })).toBeVisible();
  await expectEnglish(page);
  await expect(page.getByRole("button", { name: "Demo mode", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "My Pride", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Connect your wallet to see your lions" }),
  ).toBeVisible();
  await expect(page.locator(".lion-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Connect Wallet", exact: true }).first().click();
  await expect(page.getByRole("alert")).toContainText("No wallet detected");
  await expectEnglish(page);
});
test("keeps all four pages English and fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Breed", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The next generation starts here." }),
  ).toBeVisible();
  await expectEnglish(page);
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lion Marketplace" })).toBeVisible();
  await expectEnglish(page);
  await page.getByRole("button", { name: "My Pride", exact: true }).click();
  await expectEnglish(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
