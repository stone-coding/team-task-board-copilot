import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: "Main" });
}

async function expectNoHorizontalScroll(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

test("signed-in pages share a header with the app name, navigation, and Log out", async ({ page }) => {
  const boardPath = await createBoard(page, "Shell board", []);

  for (const path of ["/", "/projects", boardPath]) {
    await page.goto(path);
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Team Task Board" })).toHaveAttribute("href", "/");
    await expect(mainNav(page).getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    await expect(banner.getByRole("button", { name: "Log out" })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("the Projects link is marked as the current page on /projects", async ({ page }) => {
  await page.goto("/projects");

  await expect(mainNav(page).getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
});

test("the board has a breadcrumb back to Projects", async ({ page }) => {
  const boardPath = await createBoard(page, "Breadcrumb board", []);
  await page.goto(boardPath);

  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByText("Breadcrumb board")).toHaveAttribute("aria-current", "page");
  await breadcrumb.getByRole("link", { name: "Projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
});

test("Log out in the header ends the session", async ({ page }) => {
  await page.goto("/projects");

  await page.getByRole("banner").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects$/);
});

test("home, projects, and board pages fit at 375px without horizontal scrolling", async ({ page }) => {
  const boardPath = await createBoard(page);
  await page.setViewportSize({ width: 375, height: 800 });

  for (const path of ["/", "/projects", boardPath]) {
    await page.goto(path);
    await expect(page.getByRole("banner")).toBeVisible();
    await expectNoHorizontalScroll(page, 375);
  }
});
