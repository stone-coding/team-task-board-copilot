import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD, signIn, uniqueEmail } from "./helpers/auth";
import { createBoard } from "./helpers/board";

// Next.js keeps the previous route mounted but hidden after client navigation, so match visible fields only.
function field(page: Page, label: string) {
  return page.getByLabel(label).filter({ visible: true });
}

test("an unauthenticated visitor is redirected to the login page", async ({ page }) => {
  await page.goto("/projects/demo");

  await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2Fdemo$/);
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
});

test("register, log in, reach the board, and log out", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await field(page, "Name").fill("Ada Lovelace");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await expect(page.getByRole("status")).toHaveText("Account created. Log in to continue.");

  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Team Task Board" })).toBeVisible();

  const boardPath = await createBoard(page, "Ada's board", []);
  await page.goto(boardPath);
  await expect(page.getByRole("heading", { level: 1, name: "Ada's board" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto(boardPath);
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("login returns the visitor to the page they asked for", async ({ page }) => {
  const email = await signIn(page);
  const boardPath = await createBoard(page, "Return here", []);
  await page.context().clearCookies();

  await page.goto(boardPath);
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Return here" })).toBeVisible();
});

test("registering a taken email shows a clear message", async ({ page }) => {
  const email = await signIn(page);
  await page.context().clearCookies();

  await page.goto("/register");
  await field(page, "Name").fill("Someone Else");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "An account with this email already exists" })).toBeVisible();
});

test("the login page has no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/login");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
