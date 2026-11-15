import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_PASSWORD } from "./helpers/auth";
import { createBoard } from "./helpers/board";

async function newUser(browser: Browser, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `e2e-${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  expect((await page.request.post("/api/v1/auth/register", { data: { email, name, password: E2E_PASSWORD } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/auth/login", { data: { email, password: E2E_PASSWORD } })).status()).toBe(200);
  return { context, page, email };
}

function feed(page: Page) {
  return page.getByRole("region", { name: "Project activity" });
}

test("the activity feed shows who did what, for members only", async ({ browser }) => {
  const owner = await newUser(browser, "Olivia");
  const member = await newUser(browser, "Mason");
  const outsider = await newUser(browser, "Nora");
  const boardPath = await createBoard(owner.page, "Activity", []);
  await owner.page.goto(boardPath);
  await expect(feed(owner.page)).toContainText("No activity yet");

  const add = owner.page.getByRole("form", { name: "Add member" });
  await add.getByRole("textbox", { name: "Member email" }).fill(member.email);
  await add.getByRole("button", { name: "Add member" }).click();
  await expect(owner.page.getByRole("region", { name: "Project members" }).getByText(member.email)).toBeVisible();

  await member.page.goto(boardPath);
  const form = member.page.getByRole("form", { name: "Add task" });
  await form.getByRole("textbox", { name: "Title" }).fill("Write copy");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(member.page.getByRole("heading", { level: 3, name: "Write copy" })).toBeVisible();
  const saved = member.page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await member.page.getByRole("combobox", { name: "Status for Write copy" }).selectOption("DONE");
  await saved;
  await member.page.getByRole("button", { name: "Comments for Write copy" }).click();
  const thread = member.page.getByRole("region", { name: "Comments on Write copy" });
  await thread.getByRole("textbox", { name: "Add a comment" }).fill("Done, please review");
  await thread.getByRole("button", { name: "Post comment" }).click();
  await expect(thread.getByText("Done, please review")).toBeVisible();

  await feed(owner.page).getByRole("button", { name: "Refresh activity" }).click();
  await expect(feed(owner.page).getByRole("listitem")).toHaveText([
    /Mason commented on "Write copy"/,
    /Mason moved "Write copy" from To Do to Done/,
    /Mason created "Write copy"/,
    /Olivia added Mason to the project/,
  ]);
  await expect(feed(owner.page).locator("time")).toHaveCount(4);

  const projectId = boardPath.split("/").pop();
  expect((await outsider.page.request.get(`/api/v1/projects/${projectId}/activity`)).status()).toBe(404);

  await owner.context.close();
  await member.context.close();
  await outsider.context.close();
});

test("the activity feed fits at 375px without horizontal scrolling", async ({ browser }) => {
  const owner = await newUser(browser, "Ada");
  const boardPath = await createBoard(owner.page, "Narrow activity");
  await owner.page.setViewportSize({ width: 375, height: 800 });
  await owner.page.goto(boardPath);

  await expect(feed(owner.page)).toBeVisible();
  expect(await owner.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await owner.context.close();
});
