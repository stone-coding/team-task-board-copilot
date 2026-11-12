import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

const COLUMNS = ["To Do", "In Progress", "Done"];

let boardPath: string;

// Every page except /login and /register requires a session (#4, US1 criterion 4). The board reads from the API (#8).
test.beforeEach(async ({ page }) => {
  await signIn(page);
  boardPath = await createBoard(page);
});

function countPill(page: Page, column: string, text: string) {
  return page.getByRole("region", { name: column }).getByText(text, { exact: true });
}

async function columnBoxes(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(boardPath);
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

test("the board shows the project's tasks from the API in columns with their counts", async ({ page }) => {
  await page.goto(boardPath);

  await expect(page.getByRole("heading", { level: 1, name: "Demo Project" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(COLUMNS);
  await expect(countPill(page, "To Do", "3 tasks")).toBeVisible();
  await expect(countPill(page, "In Progress", "2 tasks")).toBeVisible();
  await expect(countPill(page, "Done", "0 tasks")).toBeVisible();
  await expect(page.getByRole("region", { name: "Done" })).toContainText("No tasks yet");
});

test("changing a card's status moves it and updates the counts", async ({ page }) => {
  await page.goto(boardPath);

  await page.getByRole("combobox", { name: "Status for Draft onboarding checklist" }).selectOption("IN_PROGRESS");

  await expect(countPill(page, "To Do", "2 tasks")).toBeVisible();
  await expect(countPill(page, "In Progress", "3 tasks")).toBeVisible();
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("Draft onboarding checklist");
});

test("a status change is saved and survives a reload", async ({ page }) => {
  await page.goto(boardPath);

  const saved = page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await page.getByRole("combobox", { name: "Status for Write release notes" }).selectOption("DONE");
  await saved;
  await page.reload();

  await expect(page.getByRole("region", { name: "Done" })).toContainText("Write release notes");
  await expect(countPill(page, "Done", "1 task")).toBeVisible();
  await expect(countPill(page, "To Do", "2 tasks")).toBeVisible();
});

test("a failed save moves the card back and shows an error", async ({ page }) => {
  await page.route("**/api/v1/tasks/*", (route) =>
    route.fulfill({ status: 500, json: { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } } }),
  );
  await page.goto(boardPath);

  await page.getByRole("combobox", { name: "Status for Write release notes" }).selectOption("DONE");

  await expect(page.getByRole("alert").filter({ hasText: 'Could not save the status of "Write release notes"' })).toBeVisible();
  await expect(page.getByRole("region", { name: "To Do" })).toContainText("Write release notes");
  await expect(countPill(page, "Done", "0 tasks")).toBeVisible();
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

test("another user's project shows the not-found page", async ({ browser }) => {
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await signIn(otherPage);
  await otherPage.goto(boardPath);

  await expect(otherPage.getByText("This page could not be found.")).toBeVisible();
  await expect(otherPage.getByText("Write release notes")).toHaveCount(0);
  await otherContext.close();
});
