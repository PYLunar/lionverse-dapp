import { expect } from "@playwright/test";

export async function expectEnglish(page) {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("body")).not.toContainText(/\p{Script=Han}/u);
  const labels = await page
    .locator("*")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        ["aria-label", "alt", "title", "placeholder"].map(
          (attribute) => element.getAttribute(attribute) || "",
        ),
      ),
    );
  expect([await page.title(), ...labels].join(" ")).not.toMatch(/\p{Script=Han}/u);
}
