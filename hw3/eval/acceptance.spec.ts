/**
 * HW3 hidden acceptance tests for issue "Build three-column Kanban board with mock data".
 *
 * Written and committed BEFORE either experiment run. Neither run can see this file.
 * The tests only use what the PRD (US4) and the mockup promise: the URL, the visible text,
 * and accessible roles and names. They never depend on file names, CSS classes, or test ids,
 * so a run is not penalised for choosing a different internal structure.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const URL = "/projects/demo";
const COLUMNS = ["To Do", "In Progress", "Done"] as const;
type Column = (typeof COLUMNS)[number];

const TASKS: { title: string; column: Column }[] = [
  { title: "Draft onboarding checklist", column: "To Do" },
  { title: "Collect design feedback", column: "To Do" },
  { title: "Write release notes", column: "To Do" },
  { title: "Set up project repository", column: "In Progress" },
  { title: "Review sprint backlog", column: "In Progress" },
];

const OUT = process.env.EVAL_OUT ?? "eval-out";

/**
 * Finds each column's container in the browser: start at the heading whose text begins
 * with the column name, then walk up while the parent still contains only that one
 * column heading. Returns the container's text, its box, and the titles it holds.
 */
async function readColumns(page: Page) {
  return page.evaluate(
    ({ columns, titles }) => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,[role=heading]"),
      );
      const isColumnHeading = (el: HTMLElement) =>
        columns.some((c) => (el.textContent ?? "").trim().startsWith(c)) &&
        (el.textContent ?? "").trim().length < 40;
      const columnHeadings = headings.filter(isColumnHeading);
      const countHeadingsIn = (el: Element) => columnHeadings.filter((h) => el.contains(h)).length;

      const result: Record<string, { text: string; top: number; left: number; titles: string[]; order: number }> = {};
      for (const name of columns) {
        const h = columnHeadings.find((el) => {
          const t = (el.textContent ?? "").trim();
          // "Done" must not match "To Do…"; require the name followed by end, space, or digit
          return new RegExp(`^${name}(\\s|\\d|$)`).test(t);
        });
        if (!h) continue;
        let container: HTMLElement = h;
        while (container.parentElement && countHeadingsIn(container.parentElement) === 1) {
          container = container.parentElement;
        }
        const box = container.getBoundingClientRect();
        const text = container.innerText;
        result[name] = {
          text,
          top: Math.round(box.top),
          left: Math.round(box.left),
          titles: titles.filter((t) => text.includes(t)),
          order: columnHeadings.indexOf(h),
        };
      }
      return result;
    },
    { columns: [...COLUMNS], titles: TASKS.map((t) => t.title) },
  );
}

/** The column's text with option labels removed, so counts can be read reliably. */
function headerNumbers(text: string): string[] {
  const withoutOptions = text.replace(/To Do|In Progress|Done/g, " ");
  return withoutOptions.match(/\b\d+\b/g) ?? [];
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function setStatus(page: Page, title: string, label: Column) {
  const control = page.getByRole("combobox", { name: new RegExp(escape(title)) });
  await expect(control).toHaveCount(1);
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await control.selectOption({ label });
  } else {
    await control.click();
    await page.getByRole("option", { name: label }).click();
  }
}

test.describe("US4 board — hidden acceptance", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto(URL);
    expect(res?.status(), "board route responds").toBeLessThan(400);
  });

  test("AC1: shows To Do, In Progress, Done column headings in order", async ({ page }) => {
    const cols = await readColumns(page);
    for (const c of COLUMNS) expect(cols[c], `column ${c}`).toBeDefined();
    expect(cols["To Do"].order).toBeLessThan(cols["In Progress"].order);
    expect(cols["In Progress"].order).toBeLessThan(cols["Done"].order);
  });

  test("AC2: each mock task is in the column matching its status", async ({ page }) => {
    const cols = await readColumns(page);
    for (const t of TASKS) {
      expect(cols[t.column]?.titles ?? [], `${t.title} in ${t.column}`).toContain(t.title);
    }
  });

  test("AC3: each column header shows its task count (3 / 2 / 0)", async ({ page }) => {
    const cols = await readColumns(page);
    expect(headerNumbers(cols["To Do"].text)).toContain("3");
    expect(headerNumbers(cols["In Progress"].text)).toContain("2");
    expect(headerNumbers(cols["Done"].text)).toContain("0");
  });

  test("AC4: each card has a status dropdown whose accessible name identifies the task", async ({ page }) => {
    for (const t of TASKS) {
      const control = page.getByRole("combobox", { name: new RegExp(escape(t.title)) });
      await expect(control, t.title).toHaveCount(1);
    }
  });

  test("AC5: changing status moves the card immediately and updates counts", async ({ page }) => {
    await setStatus(page, "Write release notes", "Done");
    const cols = await readColumns(page);
    expect(cols["Done"].titles).toContain("Write release notes");
    expect(cols["To Do"].titles).not.toContain("Write release notes");
    expect(headerNumbers(cols["To Do"].text)).toContain("2");
    expect(headerNumbers(cols["Done"].text)).toContain("1");
  });

  test("AC6: an empty column shows 'No tasks yet' (initially Done, then emptied In Progress)", async ({ page }) => {
    let cols = await readColumns(page);
    expect(cols["Done"].text.toLowerCase()).toContain("no tasks yet");
    await setStatus(page, "Set up project repository", "Done");
    await setStatus(page, "Review sprint backlog", "Done");
    cols = await readColumns(page);
    expect(cols["In Progress"].text.toLowerCase()).toContain("no tasks yet");
    expect(cols["Done"].text.toLowerCase()).not.toContain("no tasks yet");
  });

  test("AC7: columns are side by side at 1280px", async ({ page }) => {
    const cols = await readColumns(page);
    const [a, b, c] = COLUMNS.map((n) => cols[n]);
    expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(8);
    expect(Math.abs(b.top - c.top)).toBeLessThanOrEqual(8);
    expect(a.left).toBeLessThan(b.left);
    expect(b.left).toBeLessThan(c.left);
  });

  test("AC8: columns stack and there is no horizontal page scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const cols = await readColumns(page);
    const [a, b, c] = COLUMNS.map((n) => cols[n]);
    expect(a.top).toBeLessThan(b.top);
    expect(b.top).toBeLessThan(c.top);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("Mockup: page h1 shows the project name", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: /Demo Project/ })).toBeVisible();
  });

  test("A11y: no serious or critical axe violations (WCAG 2 A/AA)", async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, "axe.json"),
      JSON.stringify(
        results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        null,
        2,
      ),
    );
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => v.id)).toEqual([]);
  });

  test("Evidence: screenshots at 1280px and 375px (always passes)", async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, "board-1280.png"), fullPage: true });
    await page.setViewportSize({ width: 375, height: 800 });
    await page.screenshot({ path: path.join(OUT, "board-375.png"), fullPage: true });
  });
});
