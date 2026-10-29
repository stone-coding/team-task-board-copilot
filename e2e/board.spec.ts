import { expect, test } from "@playwright/test";

test("demo board shows the columns in order with their counts", async ({ page }) => {
  await page.goto("/projects/demo");

  await expect(page.getByRole("heading", { level: 1, name: "Demo Project" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["To Do", "In Progress", "Done"]);
  await expect(page.getByRole("region", { name: "To Do" })).toContainText("3");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("2");
  await expect(page.getByRole("region", { name: "Done" })).toContainText("No tasks yet");
});

test("changing a card's status moves it and updates the counts", async ({ page }) => {
  await page.goto("/projects/demo");

  await page.getByRole("combobox", { name: "Status for Draft onboarding checklist" }).selectOption("IN_PROGRESS");

  await expect(page.getByRole("region", { name: "To Do" })).toContainText("2");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("3");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("Draft onboarding checklist");
});

test("columns sit side by side at 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projects/demo");

  const boxes = await Promise.all(
    ["To Do", "In Progress", "Done"].map((name) => page.getByRole("region", { name }).boundingBox()),
  );
  const [todo, progress, done] = boxes.map((box) => box ?? { x: 0, y: 0, width: 0, height: 0 });
  expect(progress.y).toBe(todo.y);
  expect(done.y).toBe(todo.y);
  expect(progress.x).toBeGreaterThan(todo.x);
  expect(done.x).toBeGreaterThan(progress.x);
});

test("columns stack without horizontal scrolling at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/projects/demo");

  const boxes = await Promise.all(
    ["To Do", "In Progress", "Done"].map((name) => page.getByRole("region", { name }).boundingBox()),
  );
  const [todo, progress, done] = boxes.map((box) => box ?? { x: 0, y: 0, width: 0, height: 0 });
  expect(progress.y).toBeGreaterThan(todo.y);
  expect(done.y).toBeGreaterThan(progress.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("an unknown project shows the not-found page", async ({ page }) => {
  await page.goto("/projects/unknown");

  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByRole("region", { name: "To Do" })).toHaveCount(0);
});
