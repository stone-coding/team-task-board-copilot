import { expect, test } from "@playwright/test";

test("demo board displays columns and moves a task", async ({ page }) => {
  await page.goto("/projects/demo");

  await expect(page.getByRole("heading", { name: "Demo Project" })).toBeVisible();
  await expect(page.getByRole("region", { name: "To Do" })).toContainText("3");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("2");
  await expect(page.getByRole("region", { name: "Done" })).toContainText("No tasks yet");

  await page
    .getByRole("combobox", { name: "Status for Draft onboarding checklist" })
    .selectOption("IN_PROGRESS");

  await expect(page.getByRole("region", { name: "To Do" })).toContainText("2");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("3");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("Draft onboarding checklist");
});

test("demo board fits a 375px viewport without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/projects/demo");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});