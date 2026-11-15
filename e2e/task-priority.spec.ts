import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

let boardPath: string;

test.beforeEach(async ({ page }) => {
  await signIn(page);
  boardPath = await createBoard(page);
});

function addForm(page: Page) {
  return page.getByRole("form", { name: "Add task" });
}

function titlesIn(page: Page, column: string) {
  return page.getByRole("region", { name: column }).getByRole("heading", { level: 3 });
}

test("a High priority task is created at the top of To Do with a badge and survives a reload", async ({ page }) => {
  await page.goto(boardPath);

  await expect(addForm(page).getByRole("combobox", { name: "Priority" })).toHaveValue("MEDIUM");
  await addForm(page).getByRole("textbox", { name: "Title" }).fill("Fix login bug");
  await addForm(page).getByRole("combobox", { name: "Priority" }).selectOption("HIGH");
  await addForm(page).getByRole("button", { name: "Add task" }).click();

  await expect(titlesIn(page, "To Do").first()).toHaveText("Fix login bug");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Fix login bug" }) });
  await expect(card.getByText("High priority")).toBeVisible();

  await page.reload();
  await expect(titlesIn(page, "To Do").first()).toHaveText("Fix login bug");
  await expect(card.getByText("High priority")).toBeVisible();
});

test("lowering a task's priority moves it below Medium tasks and is saved", async ({ page }) => {
  await page.goto(boardPath);

  await page.getByRole("button", { name: "Edit Draft onboarding checklist" }).click();
  const editForm = page.getByRole("form", { name: "Edit Draft onboarding checklist" });
  await editForm.getByRole("combobox", { name: "Priority" }).selectOption("LOW");
  const saved = page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await editForm.getByRole("button", { name: "Save" }).click();
  await saved;

  await expect(titlesIn(page, "To Do")).toHaveText(["Collect design feedback", "Write release notes", "Draft onboarding checklist"]);
  await page.reload();
  await expect(titlesIn(page, "To Do").last()).toHaveText("Draft onboarding checklist");
});

test("the priority filter combines with status and search", async ({ page }) => {
  await page.goto(boardPath);
  await addForm(page).getByRole("textbox", { name: "Title" }).fill("Ship the hotfix");
  await addForm(page).getByRole("combobox", { name: "Priority" }).selectOption("HIGH");
  await addForm(page).getByRole("button", { name: "Add task" }).click();
  await expect(titlesIn(page, "To Do").first()).toHaveText("Ship the hotfix");

  await page.getByRole("combobox", { name: "Filter by priority" }).selectOption("HIGH");
  await expect(page.getByRole("region").getByRole("heading", { level: 3 })).toHaveText(["Ship the hotfix"]);

  await page.getByRole("combobox", { name: "Filter by status" }).selectOption("IN_PROGRESS");
  await expect(page.getByRole("region").getByRole("heading", { level: 3 })).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("region").getByRole("heading", { level: 3 })).toHaveCount(6);
});
