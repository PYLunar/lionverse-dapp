import { test, expect } from "@playwright/test";

test("explores, filters, reveals genes, mints and persists a demo collectible", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "欢迎来到，你的狮屿." })).toBeVisible();
  await expect(page.locator(".lion-card")).toHaveCount(6);
  await page.getByLabel("搜索狮子").fill("钻石");
  await expect(page.locator(".lion-card")).toHaveCount(1);
  await page.locator(".lion-card").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".traits-grid")).toContainText("钻石狮");
  await expect(page.locator(".traits-grid")).toContainText("水晶角冠");
  await page.keyboard.press("Escape");
  await page.getByLabel("搜索狮子").fill("");
  await page.getByRole("button", { name: "领养随机狮子" }).click();
  await page.getByRole("button", { name: "揭晓我的小狮子" }).click();
  await expect(page.locator(".detail-title")).toContainText("#0007");
  await page.getByLabel("关闭弹窗").click();
  await expect(page.locator(".lion-card")).toHaveCount(7);
  await page.reload();
  await expect(page.locator(".lion-card")).toHaveCount(7);
  expect(errors).toEqual([]);
});

test("breeds owned parents, records lineage and enforces the cooldown", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "繁育小屋", exact: true }).click();
  await page.getByLabel("选择亲代 A").selectOption("1");
  await page.getByLabel("选择亲代 B").selectOption("2");
  await page.getByRole("button", { name: "迎接新生命" }).click();
  await expect(page.locator(".detail-title")).toContainText("GEN 1");
  await expect(page.locator(".detail-meta")).toContainText("#0001 × #0002");
  await page.getByLabel("关闭弹窗").click();
  await page.getByLabel("选择亲代 A").selectOption("1");
  await page.getByLabel("选择亲代 B").selectOption("2");
  await expect(page.getByRole("button", { name: "迎接新生命" })).toBeDisabled();
  await expect(page.locator(".rest-label").first()).toContainText("休息中");
});

test("documents actual rare varieties and handles an unavailable wallet honestly", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "图鉴与规则", exact: true }).click();
  await expect(page.locator(".species-guide")).toContainText("黄金狮");
  await expect(page.locator(".species-guide")).toContainText("3.5%");
  await expect(page.locator(".species-guide")).toContainText("1.49%");
  await expect(page.locator(".trait-guide")).toContainText("星芒瞳 · 1%");
  await page.getByRole("button", { name: "连接钱包", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(/未检测到钱包|尚未配置/);
});

test("handles corrupt browser storage without crashing", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lionverse-demo-v2", '[{"id":1}]'));
  await page.goto("/");
  await expect(page.locator(".lion-card")).toHaveCount(6);
});

test("fits mobile screens and supports the mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByLabel("打开导航").click();
  await page.getByRole("button", { name: "我的狮群" }).click();
  await expect(page.locator(".lion-card")).toHaveCount(3);
  await page.locator(".lion-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
