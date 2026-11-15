import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

let boardPath: string;

test.beforeEach(async ({ page }) => {
  await signIn(page);
  boardPath = await createBoard(page);
});

function search(page: Page) {
  return page.getByRole("searchbox", { name: "Search tasks" });
}

function cardTitles(page: Page) {
  return page.getByRole("region").getByRole("heading", { level: 3 });
}

test("searching narrows the board and Clear filters brings every task back", async ({ page }) => {
  await page.goto(boardPath);

  await search(page).fill("release");
  await expect(cardTitles(page)).toHaveText(["Write release notes"]);
  await expect(page.getByRole("search", { name: "Filter tasks" }).getByRole("status")).toHaveText("Showing 1 of 5 tasks");
  await expect(page.getByRole("region", { name: "In Progress" })).toContainText("No matching tasks");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(cardTitles(page)).toHaveCount(5);
  await expect(search(page)).toHaveValue("");
});

test("the status filter combines with the search", async ({ page }) => {
  await page.goto(boardPath);

  await page.getByRole("combobox", { name: "Filter by status" }).selectOption("IN_PROGRESS");
  await expect(cardTitles(page)).toHaveText(["Set up project repository", "Review sprint backlog"]);

  await search(page).fill("backlog");
  await expect(cardTitles(page)).toHaveText(["Review sprint backlog"]);
});

test("a status change made while filtered is saved", async ({ page }) => {
  await page.goto(boardPath);
  await page.getByRole("combobox", { name: "Filter by status" }).selectOption("TODO");

  const saved = page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await page.getByRole("combobox", { name: "Status for Write release notes" }).selectOption("DONE");
  await expect(page.getByRole("heading", { name: "Write release notes" })).toHaveCount(0);
  await saved;

  await page.reload();
  await expect(page.getByRole("region", { name: "Done" })).toContainText("Write release notes");
});

test("the filters fit at 375px without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(boardPath);

  await expect(search(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
