import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

let boardPath: string;

test.beforeEach(async ({ page }) => {
  await signIn(page);
  boardPath = await createBoard(page);
});

function overview(page: Page) {
  return page.getByRole("group", { name: "Project overview" });
}

// Each stat is a <dt> label followed by its <dd> value.
function stat(page: Page, label: string) {
  return overview(page).locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]");
}

test("the overview summarizes the project's tasks", async ({ page }) => {
  await page.goto(boardPath);

  await expect(stat(page, "Total tasks")).toHaveText("5");
  await expect(stat(page, "In progress")).toHaveText("2");
  await expect(stat(page, "Completed")).toHaveText("0");
  await expect(stat(page, "Completion rate")).toHaveText("0%");
  await expect(overview(page).getByRole("progressbar", { name: "Completion rate" })).toHaveAttribute("value", "0");
});

test("completing a task updates the overview, and it survives a reload", async ({ page }) => {
  await page.goto(boardPath);

  const saved = page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await page.getByRole("combobox", { name: "Status for Set up project repository" }).selectOption("DONE");

  await expect(stat(page, "Completed")).toHaveText("1");
  await expect(stat(page, "In progress")).toHaveText("1");
  await expect(stat(page, "Completion rate")).toHaveText("20%");
  await saved;
  await page.reload();
  await expect(stat(page, "Completion rate")).toHaveText("20%");
  await expect(overview(page).getByText("1 of 5 tasks completed")).toBeVisible();
});

test("the overview fits at 375px without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(boardPath);

  await expect(overview(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
