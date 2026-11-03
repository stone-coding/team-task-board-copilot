import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";

function projectNames(page: Page) {
  return page.getByRole("list").getByRole("heading", { level: 3 });
}

async function createProject(page: Page, name: string) {
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
}

test("an unauthenticated visitor is redirected from /projects to the login page", async ({ page }) => {
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects$/);
});

test("create projects, see them newest first, and delete one after confirming", async ({ page }) => {
  await signIn(page);
  await page.goto("/projects");

  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
  await expect(page.getByText("No projects yet")).toBeVisible();

  await createProject(page, "Alpha");
  await createProject(page, "Beta");
  await expect(projectNames(page)).toHaveText(["Beta", "Alpha"]);
  await expect(page.getByLabel("Project name")).toHaveValue("");

  await page.getByRole("button", { name: "Delete Beta" }).click();
  await page.getByRole("button", { name: "Cancel deleting Beta" }).click();
  await expect(projectNames(page)).toHaveText(["Beta", "Alpha"]);

  await page.getByRole("button", { name: "Delete Beta" }).click();
  await page.getByRole("button", { name: "Confirm delete Beta" }).click();
  await expect(projectNames(page)).toHaveText(["Alpha"]);

  await page.reload();
  await expect(projectNames(page)).toHaveText(["Alpha"]);
  await expect(page.getByRole("link", { name: "Alpha" })).toHaveAttribute("href", /^\/projects\/[\w-]+$/);
});

test("projects are private to their owner", async ({ page, browser }) => {
  await signIn(page);
  await page.goto("/projects");
  await createProject(page, "Ada's secret");

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await signIn(otherPage);
  await otherPage.goto("/projects");
  await expect(otherPage.getByText("No projects yet")).toBeVisible();
  await expect(otherPage.getByText("Ada's secret")).toHaveCount(0);
  await otherContext.close();
});

test("the projects page has no horizontal scroll at 375px", async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/projects");
  await createProject(page, "A project with a fairly long name that has to wrap on small screens");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
