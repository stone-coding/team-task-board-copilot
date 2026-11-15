import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

function column(page: Page, name: string) {
  return page.getByRole("region", { name });
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await page.goto(await createBoard(page, "Launch", []));
});

test("add, edit, and delete a task, and the board keeps the changes after a reload", async ({ page }) => {
  await page.getByRole("textbox", { name: "Title" }).fill("Draft the announcement");
  await page.getByRole("textbox", { name: "Description (optional)" }).fill("Blog and newsletter");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(column(page, "To Do").getByRole("heading", { name: "Draft the announcement" })).toBeVisible();
  await expect(column(page, "To Do")).toContainText("Blog and newsletter");

  await page.getByRole("button", { name: "Edit Draft the announcement" }).click();
  const editForm = page.getByRole("form", { name: "Edit Draft the announcement" });
  await editForm.getByRole("textbox", { name: "Title" }).fill("Publish the announcement");
  await editForm.getByRole("button", { name: "Save" }).click();
  await expect(column(page, "To Do").getByRole("heading", { name: "Publish the announcement" })).toBeVisible();

  await page.reload();
  await expect(column(page, "To Do").getByRole("heading", { name: "Publish the announcement" })).toBeVisible();
  await expect(column(page, "To Do")).toContainText("Blog and newsletter");

  await page.getByRole("button", { name: "Delete Publish the announcement" }).click();
  await page.getByRole("button", { name: "Confirm delete Publish the announcement" }).click();
  await expect(column(page, "To Do")).toContainText("No tasks yet");

  await page.reload();
  await expect(column(page, "To Do")).toContainText("No tasks yet");
});

test("an empty title is announced and creates nothing", async ({ page }) => {
  await page.getByRole("button", { name: "Add task" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Task title is required" })).toBeVisible();
  await expect(column(page, "To Do")).toContainText("No tasks yet");
});

test("the add form can be used with the keyboard only", async ({ page }) => {
  await page.getByRole("textbox", { name: "Title" }).focus();
  await page.keyboard.type("Keyboard task");
  await page.keyboard.press("Enter");

  await expect(column(page, "To Do").getByRole("heading", { name: "Keyboard task" })).toBeVisible();
});
