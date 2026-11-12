import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD, uniqueEmail } from "./helpers/auth";

// The core journey through the UI only (#12): no API shortcuts, so it covers what a new user actually does.

// Next.js keeps the previous route mounted but hidden after client navigation, so match visible fields only.
function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}

function column(page: Page, name: string) {
  return page.getByRole("region", { name });
}

test("register, create a project and a task, move it to Done, and still see it there after a reload", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await field(page, "Name").fill("Journey User");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/login\?registered=1$/);

  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Team Task Board" })).toBeVisible();

  await page.goto("/projects");
  await field(page, "Project name").fill("Launch plan");
  await page.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("link", { name: "Launch plan", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Launch plan" })).toBeVisible();

  await field(page, "Title").fill("Write the press release");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(column(page, "To Do").getByRole("heading", { name: "Write the press release" })).toBeVisible();

  const saved = page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await page.getByRole("combobox", { name: "Status for Write the press release" }).selectOption("DONE");
  await expect(column(page, "Done").getByRole("heading", { name: "Write the press release" })).toBeVisible();
  await saved;

  await page.reload();
  await expect(column(page, "Done").getByRole("heading", { name: "Write the press release" })).toBeVisible();
  await expect(column(page, "To Do")).toContainText("No tasks yet");
});
