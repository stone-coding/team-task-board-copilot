import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { createBoard } from "./helpers/board";

async function newUser(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = await signIn(page);
  return { context, page, email };
}

function members(page: Page) {
  return page.getByRole("region", { name: "Project members" });
}

async function addMember(page: Page, email: string) {
  const form = page.getByRole("form", { name: "Add member" });
  await form.getByRole("textbox", { name: "Member email" }).fill(email);
  await form.getByRole("button", { name: "Add member" }).click();
  await expect(members(page).getByText(email)).toBeVisible();
}

test("an owner shares a project; the member sees it, edits a task, and has no owner controls", async ({ browser }) => {
  const owner = await newUser(browser);
  const member = await newUser(browser);
  const boardPath = await createBoard(owner.page, "Shared launch");

  await owner.page.goto(boardPath);
  await addMember(owner.page, member.email);

  await member.page.goto("/projects");
  const item = member.page.getByRole("listitem").filter({ has: member.page.getByRole("link", { name: "Shared launch" }) });
  await expect(item.getByText("Shared with you")).toBeVisible();
  await expect(item.getByRole("button", { name: "Delete Shared launch" })).toHaveCount(0);

  await item.getByRole("link", { name: "Shared launch" }).click();
  await expect(member.page.getByRole("heading", { level: 1, name: "Shared launch" })).toBeVisible();
  await expect(member.page.getByRole("form", { name: "Add member" })).toHaveCount(0);
  const saved = member.page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await member.page.getByRole("combobox", { name: "Status for Write release notes" }).selectOption("DONE");
  await saved;

  await owner.page.reload();
  await expect(owner.page.getByRole("region", { name: "Done" })).toContainText("Write release notes");

  await owner.context.close();
  await member.context.close();
});

test("a nonmember gets the not-found page and no data from a direct link", async ({ browser }) => {
  const owner = await newUser(browser);
  const outsider = await newUser(browser);
  const boardPath = await createBoard(owner.page, "Private plan");

  await outsider.page.goto(boardPath);
  await expect(outsider.page.getByText("This page could not be found.")).toBeVisible();
  await expect(outsider.page.getByText("Write release notes")).toHaveCount(0);

  await owner.context.close();
  await outsider.context.close();
});

test("removing a member revokes access immediately", async ({ browser }) => {
  const owner = await newUser(browser);
  const member = await newUser(browser);
  const boardPath = await createBoard(owner.page, "Revocable");
  await owner.page.goto(boardPath);
  await addMember(owner.page, member.email);

  await member.page.goto(boardPath);
  await expect(member.page.getByRole("heading", { level: 1, name: "Revocable" })).toBeVisible();

  await members(owner.page).getByRole("button", { name: /^Remove / }).click();
  await expect(members(owner.page).getByText(member.email)).toHaveCount(0);

  await member.page.reload();
  await expect(member.page.getByText("This page could not be found.")).toBeVisible();
  await member.page.goto("/projects");
  await expect(member.page.getByRole("link", { name: "Revocable" })).toHaveCount(0);

  await owner.context.close();
  await member.context.close();
});

test("a member can leave a shared project", async ({ browser }) => {
  const owner = await newUser(browser);
  const member = await newUser(browser);
  const boardPath = await createBoard(owner.page, "Leavable");
  await owner.page.goto(boardPath);
  await addMember(owner.page, member.email);

  await member.page.goto(boardPath);
  await members(member.page).getByRole("button", { name: "Leave project" }).click();
  await members(member.page).getByRole("button", { name: "Confirm leave" }).click();
  await expect(member.page).toHaveURL(/\/projects$/);
  await expect(member.page.getByRole("link", { name: "Leavable" })).toHaveCount(0);

  await owner.context.close();
  await member.context.close();
});
