import { expect, test } from "@playwright/test";
import { E2E_PASSWORD, signIn, uniqueEmail } from "./helpers/auth";

test("an unauthenticated visitor is redirected to the login page", async ({ page }) => {
  await page.goto("/projects/demo");

  await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2Fdemo$/);
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
});

test("register, log in, reach the board, and log out", async ({ page }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1$/);
  await expect(page.getByRole("status")).toHaveText("Account created. Log in to continue.");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Team Task Board" })).toBeVisible();

  await page.goto("/projects/demo");
  await expect(page.getByRole("heading", { level: 1, name: "Demo Project" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/projects/demo");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("login returns the visitor to the page they asked for", async ({ page }) => {
  const email = await signIn(page);
  await page.context().clearCookies();

  await page.goto("/projects/demo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Demo Project" })).toBeVisible();
});

test("registering a taken email shows a clear message", async ({ page }) => {
  const email = await signIn(page);
  await page.context().clearCookies();

  await page.goto("/register");
  await page.getByLabel("Name").fill("Someone Else");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("alert")).toHaveText("An account with this email already exists");
});

test("the login page has no horizontal scroll at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/login");

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
