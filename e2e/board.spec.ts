import { expect, test, type Page } from "@playwright/test";

const COLUMNS = ["To Do", "In Progress", "Done"];

function countPill(page: Page, column: string, text: string) {
  return page.getByRole("region", { name: column }).getByText(text, { exact: true });
}

async function columnBoxes(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/projects/demo");
  const boxes = await Promise.all(COLUMNS.map((name) => page.getByRole("region", { name }).boundingBox()));
  return boxes.map((box) => box ?? { x: 0, y: 0, width: 0, height: 0 });
}

async function expectSideBySide(page: Page, width: number) {
  const [todo, progress, done] = await columnBoxes(page, width);
  expect(progress.y).toBe(todo.y);
  expect(done.y).toBe(todo.y);
  expect(progress.x).toBeGreaterThan(todo.x);
  expect(done.x).toBeGreaterThan(progress.x);
}

async function expectStacked(page: Page, width: number) {
  const [todo, progress, done] = await columnBoxes(page, width);
  expect(progress.y).toBeGreaterThan(todo.y);
  expect(done.y).toBeGreaterThan(progress.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

test("demo board shows the columns in order with their counts", async ({ page }) => {
  await page.goto("/projects/demo");

  await expect(page.getByRole("heading", { level: 1, name: "Demo Project" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(COLUMNS);
  await expect(countPill(page, "To Do", "3 tasks")).toBeVisible();
  await expect(countPill(page, "In Progress", "2 tasks")).toBeVisible();
  await expect(countPill(page, "Done", "0 tasks")).toBeVisible();
  await expect(page.getByRole("region", { name: "Done" })).toContainText("No tasks yet");
});

test("changing a card's status moves it and updates the counts", async ({ page }) => {
  await page.goto("/projects/demo");

  await page.getByRole("combobox", { name: "Status for Draft onboarding checklist" }).selectOption("IN_PROGRESS");

  await expect(countPill(page, "To Do", "2 tasks")).toBeVisible();
  await expect(countPill(page, "In Progress", "3 tasks")).toBeVisible();
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("Draft onboarding checklist");
});

test("columns sit side by side at 1280px", async ({ page }) => {
  await expectSideBySide(page, 1280);
});

test("columns sit side by side at the 768px breakpoint", async ({ page }) => {
  await expectSideBySide(page, 768);
});

test("columns stack just below the breakpoint at 767px", async ({ page }) => {
  await expectStacked(page, 767);
});

test("columns stack without horizontal scrolling at 375px", async ({ page }) => {
  await expectStacked(page, 375);
});

test("an unknown project shows the not-found page", async ({ page }) => {
  await page.goto("/projects/unknown");

  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByRole("region", { name: "To Do" })).toHaveCount(0);
});
