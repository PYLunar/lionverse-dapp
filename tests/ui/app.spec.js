import { test, expect } from "@playwright/test";
test("shows founder probabilities and a wallet-based collection without demo data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("初代铸造概率")).toContainText("60%");
  await expect(page.getByLabel("初代铸造概率")).toContainText("30%");
  await expect(page.getByLabel("初代铸造概率")).toContainText("10%");
  await expect(page.getByRole("button", { name: "演示模式", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "我的狮群", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "连接钱包，查看你的狮子" }),
  ).toBeVisible();
  await expect(page.locator(".lion-card")).toHaveCount(0);
  await page.getByRole("button", { name: "连接钱包", exact: true }).first().click();
  await expect(page.getByRole("alert")).toContainText("未检测到钱包");
});
test("fits a mobile viewport and exposes all three pages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "繁育", exact: true }).click();
  await expect(page.getByRole("heading", { name: "新一代，从这里开始。" })).toBeVisible();
});
