import { test, expect } from "@playwright/test";
import { initialDemo } from "../../src/domain/demo.js";
import { DEMO_OWNER } from "../../src/domain/constants.js";
import { STORAGE_KEY, LEGACY_STORAGE_KEY } from "../../src/services/demoStorage.js";

test("inspects a hidden gene and opens an independently searchable family tree", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "查看奶糖 #0002" }).click();
  await page.locator(".gene-panel summary").click();
  await expect(page.locator(".gene-panel")).toContainText("携带钻石狮");
  await expect(page.locator(".gene-panel")).toContainText("携带星芒瞳");
  await page.getByRole("button", { name: "查看家谱", exact: true }).click();
  await expect(page.locator(".family-section h2")).toContainText("奶糖的家谱");
  await expect(page.locator(".family-section")).toContainText("没有亲代记录");
  await expect(page.locator(".album-stats")).toContainText("3 / 3 只");
  await expect(page.locator(".album-entry.carried")).toContainText(["星芒瞳"]);
  await page.getByLabel("家谱编号", { exact: true }).fill("5");
  await page.getByRole("button", { name: "查询家谱" }).click();
  await expect(page.locator(".family-section h2")).toContainText("月桂的家谱");
  await page.getByLabel("家谱编号", { exact: true }).fill("9999");
  await page.getByRole("button", { name: "查询家谱" }).click();
  await expect(page.getByRole("alert")).toContainText("未找到");
});

test("breeding writes both parents and direct children into navigable genealogy", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "繁育小屋", exact: true }).click();
  await page.getByLabel("选择亲代 A").selectOption("1");
  await page.getByLabel("选择亲代 B").selectOption("2");
  await expect(page.getByRole("region", { name: "配对概率预览" })).toBeVisible();
  await page.getByRole("button", { name: "迎接新生命" }).click();
  await page.getByRole("button", { name: "查看家谱", exact: true }).click();
  await expect(page.locator(".ancestry-tree .family-card")).toHaveCount(3);
  await page.getByRole("button", { name: "追溯日冕 #0001" }).click();
  await expect(page.locator(".children-grid .family-card")).toHaveCount(1);
  await page.locator(".children-grid .family-card").click();
  await expect(page.locator(".family-root")).toContainText("#0007");
});

test("prismatic pairs forecast 94% natural offspring and a tiny monochrome branch", async ({
  page,
}) => {
  const lions = initialDemo();
  lions[0] = { ...lions[4], genes: [...lions[4].genes], id: 1, owner: DEMO_OWNER };
  lions[1] = { ...lions[4], genes: [...lions[4].genes], id: 2, owner: DEMO_OWNER };
  await page.addInitScript(
    ({ key, lions }) => localStorage.setItem(key, JSON.stringify(lions)),
    { key: STORAGE_KEY, lions },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "繁育小屋", exact: true }).click();
  await page.getByLabel("选择亲代 A").selectOption("1");
  await page.getByLabel("选择亲代 B").selectOption("2");
  await expect(page.locator(".spectrum-forecast")).toContainText("94%");
  await expect(page.locator(".spectrum-forecast")).toContainText("5.994%");
  await expect(page.locator(".spectrum-forecast")).toContainText("0.006%");
  await page.getByRole("button", { name: "图鉴与规则", exact: true }).click();
  await expect(page.locator(".species-guide")).toContainText("黑白炫彩狮");
  await expect(page.locator(".species-guide")).toContainText("0.01%");
});

test("migrates old demo assets without deleting the old key", async ({ page }) => {
  const old = initialDemo().map(({ genes, geneticsVersion, ...lion }) => lion);
  await page.addInitScript(
    ({ key, old }) => localStorage.setItem(key, JSON.stringify(old)),
    { key: LEGACY_STORAGE_KEY, old },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "查看日冕 #0001" }).click();
  await page.locator(".gene-panel summary").click();
  await expect(page.locator(".migration-note")).toContainText("旧版演示收藏");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).length,
      LEGACY_STORAGE_KEY,
    ),
  ).toBe(6);
});

test("family and gene tables stay inside a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "查看奶糖 #0002" }).click();
  await page.locator(".gene-panel summary").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "查看家谱", exact: true }).click();
  await expect(page.locator(".family-root")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
