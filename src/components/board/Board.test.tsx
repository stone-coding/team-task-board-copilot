import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "@/components/board/Board";
import { mockTasks } from "@/lib/mock-tasks";
import type { Task } from "@/lib/tasks";

function column(name: string) {
  return screen.getByRole("region", { name });
}

// The count pill shows only the number; screen readers also hear "tasks".
function count(columnName: string, value: number) {
  return within(column(columnName)).getByText(String(value));
}

// Each overview stat is a <dt> label followed by its <dd> value.
function overviewStat(label: string) {
  return within(screen.getByRole("group", { name: "Project overview" })).getByText(label, { selector: "dt" })
    .nextElementSibling;
}

// Answers each PATCH with the task it was asked to save, as the API does.
function saveSucceeds() {
  return vi.fn(async (url: string, init: RequestInit) => {
    const { status } = JSON.parse(String(init.body));
    const task = mockTasks.find((candidate) => url.endsWith(`/${candidate.id}`));
    return new Response(JSON.stringify({ task: { ...task, status } }), { status: 200 });
  });
}

describe("Board", () => {
  beforeEach(() => vi.stubGlobal("fetch", saveSucceeds()));
  afterEach(() => vi.unstubAllGlobals());

  it("shows the columns To Do, In Progress, Done in that order", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    expect(screen.getAllByRole("region")).toHaveLength(3);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("names each column by its title only, with the count beside the heading", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    expect(screen.getByRole("heading", { level: 2, name: "To Do" })).toBeInTheDocument();
    expect(count("To Do", 3)).toHaveTextContent(/^3 tasks$/);
    expect(count("In Progress", 2)).toHaveTextContent(/^2 tasks$/);
    expect(count("Done", 0)).toHaveTextContent(/^0 tasks$/);
  });

  it("puts each card in the column that matches its status", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    expect(within(column("To Do")).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(within(column("To Do")).getAllByRole("listitem")).toHaveLength(3);
    expect(within(column("In Progress")).getByRole("heading", { name: "Set up project repository" })).toBeInTheDocument();
    expect(within(column("In Progress")).getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a card's description only when it has one", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    const withDescription = within(column("To Do")).getAllByRole("listitem")[0];
    const withoutDescription = within(column("To Do")).getAllByRole("listitem")[1];
    expect(within(withDescription).getByText("List the first-week steps for new teammates.")).toBeInTheDocument();
    expect(within(withoutDescription).queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("shows \"No tasks yet\" in an empty column", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    expect(within(column("Done")).getByText("No tasks yet")).toBeInTheDocument();
    expect(within(column("To Do")).queryByText("No tasks yet")).not.toBeInTheDocument();
  });

  it("names each status dropdown after its task and lists the statuses in order", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    const select = screen.getByRole("combobox", { name: "Status for Write release notes" });
    expect(select).toHaveValue("TODO");
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("moves a card immediately and updates both counts when its status changes", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }),
      "Done",
    );

    expect(within(column("Done")).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(within(column("To Do")).queryByRole("heading", { name: "Draft onboarding checklist" })).not.toBeInTheDocument();
    expect(count("To Do", 2)).toHaveTextContent(/^2 tasks$/);
    expect(count("Done", 1)).toHaveTextContent(/^1 task$/);
    expect(within(column("Done")).queryByText("No tasks yet")).not.toBeInTheDocument();
  });

  it("shows \"No tasks yet\" when the last card leaves a column", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    for (const title of ["Set up project repository", "Review sprint backlog"]) {
      await user.selectOptions(screen.getByRole("combobox", { name: `Status for ${title}` }), "Done");
    }

    expect(within(column("In Progress")).getByText("No tasks yet")).toBeInTheDocument();
    expect(count("In Progress", 0)).toHaveTextContent(/^0 tasks$/);
    expect(within(column("Done")).getAllByRole("listitem")).toHaveLength(2);
  });

  it("saves a status change with PATCH /api/v1/tasks/:id", async () => {
    const fetchMock = saveSucceeds();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }), "Done");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tasks/t1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    await waitFor(() => expect(count("Done", 1)).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("moves the card before the save finishes", async () => {
    let finishSave: (response: Response) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => (finishSave = resolve))));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }), "Done");

    expect(within(column("Done")).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    finishSave(new Response(JSON.stringify({ task: { ...mockTasks[0], status: "DONE" } }), { status: 200 }));
    await waitFor(() => expect(count("Done", 1)).toBeInTheDocument());
  });

  it("moves the card back and shows an error when the API rejects the change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Task not found" } }), { status: 404 })),
    );
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }), "Done");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Could not save the status of "Draft onboarding checklist": Task not found',
    );
    expect(within(column("To Do")).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(count("To Do", 3)).toBeInTheDocument();
    expect(within(column("Done")).getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" })).toHaveValue("TODO");
  });

  it("moves the card back and shows an error when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Set up project repository" }), "Done");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Could not save the status of "Set up project repository": Something went wrong. Please try again.',
    );
    expect(within(column("In Progress")).getByRole("heading", { name: "Set up project repository" })).toBeInTheDocument();
  });

  it("clears the error after the next successful change", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Boom" } }), { status: 500 }))
      .mockImplementation(saveSucceeds());
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Write release notes" }), "Done");
    await screen.findByRole("alert");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Write release notes" }), "In Progress");

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("adds a created task to To Do and updates the count", async () => {
    const created = { id: "t9", projectId: "demo", title: "Plan launch", status: "TODO", priority: "MEDIUM" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ task: created }), { status: 201 })));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "Plan launch");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await within(column("To Do")).findByRole("heading", { name: "Plan launch" })).toBeInTheDocument();
    expect(count("To Do", 4)).toHaveTextContent(/^4 tasks$/);
  });

  it("shows an edited title on the card", async () => {
    const edited = { ...mockTasks[3], title: "Set up the repository" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ task: edited }), { status: 200 })));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.click(screen.getByRole("button", { name: "Edit Set up project repository" }));
    const editForm = within(screen.getByRole("form", { name: "Edit Set up project repository" }));
    await user.clear(editForm.getByRole("textbox", { name: "Title" }));
    await user.type(editForm.getByRole("textbox", { name: "Title" }), "Set up the repository");
    await user.click(editForm.getByRole("button", { name: "Save" }));

    expect(await within(column("In Progress")).findByRole("heading", { name: "Set up the repository" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for Set up the repository" })).toHaveValue("IN_PROGRESS");
  });

  it("shows a project overview derived from the board's tasks", () => {
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    expect(overviewStat("Total tasks")).toHaveTextContent(/^5$/);
    expect(overviewStat("In progress")).toHaveTextContent(/^2$/);
    expect(overviewStat("Completed")).toHaveTextContent(/^0$/);
    expect(overviewStat("Completion rate")).toHaveTextContent(/^0%$/);
  });

  it("updates the overview as soon as a card moves to Done", async () => {
    let finishSave: (response: Response) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => (finishSave = resolve))));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Set up project repository" }), "Done");

    expect(overviewStat("In progress")).toHaveTextContent(/^1$/);
    expect(overviewStat("Completed")).toHaveTextContent(/^1$/);
    expect(overviewStat("Completion rate")).toHaveTextContent(/^20%$/);
    expect(screen.getByRole("progressbar", { name: "Completion rate" })).toHaveAttribute("value", "1");
    finishSave(new Response(JSON.stringify({ task: { ...mockTasks[3], status: "DONE" } }), { status: 200 }));
    await waitFor(() => expect(overviewStat("Completed")).toHaveTextContent(/^1$/));
  });

  it("restores the overview when a status change is rolled back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Task not found" } }), { status: 404 })),
    );
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }), "Done");

    await screen.findByRole("alert");
    expect(overviewStat("Completed")).toHaveTextContent(/^0$/);
    expect(overviewStat("Completion rate")).toHaveTextContent(/^0%$/);
  });

  it("counts added and deleted tasks in the overview", async () => {
    const created = { id: "t9", projectId: "demo", title: "Plan launch", status: "TODO", priority: "MEDIUM" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ task: created }), { status: 201 })));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "Plan launch");
    await user.click(screen.getByRole("button", { name: "Add task" }));
    await waitFor(() => expect(overviewStat("Total tasks")).toHaveTextContent(/^6$/));

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await user.click(screen.getByRole("button", { name: "Delete Review sprint backlog" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Review sprint backlog" }));
    await waitFor(() => expect(overviewStat("Total tasks")).toHaveTextContent(/^5$/));
    expect(overviewStat("In progress")).toHaveTextContent(/^1$/);
  });

  it("removes a deleted card and updates the count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.click(screen.getByRole("button", { name: "Delete Review sprint backlog" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Review sprint backlog" }));

    await waitFor(() => expect(count("In Progress", 1)).toHaveTextContent(/^1 task$/));
    expect(screen.queryByRole("heading", { name: "Review sprint backlog" })).not.toBeInTheDocument();
  });
});

describe("Board: search and filter", () => {
  beforeEach(() => vi.stubGlobal("fetch", saveSucceeds()));
  afterEach(() => vi.unstubAllGlobals());

  function search() {
    return screen.getByRole("searchbox", { name: "Search tasks" });
  }

  function statusFilter() {
    return screen.getByRole("combobox", { name: "Filter by status" });
  }

  it("narrows the board to tasks whose title matches the search", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(search(), "release");

    expect(within(column("To Do")).getAllByRole("listitem")).toHaveLength(1);
    expect(within(column("To Do")).getByRole("heading", { name: "Write release notes" })).toBeInTheDocument();
    expect(within(column("In Progress")).getByText("No matching tasks")).toBeInTheDocument();
    expect(count("To Do", 1)).toHaveTextContent(/^1 task$/);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1 of 5 tasks");
  });

  it("matches a task by its description", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(search(), "TEAMMATES");

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Draft onboarding checklist",
    ]);
  });

  it("shows only the selected status", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(statusFilter(), "In Progress");

    expect(within(column("In Progress")).getAllByRole("listitem")).toHaveLength(2);
    expect(within(column("To Do")).getByText("No matching tasks")).toBeInTheDocument();
    expect(within(column("Done")).getByText("No matching tasks")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 5 tasks");
  });

  it("restores every task and the empty-state text after Clear filters", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(search(), "release");
    await user.selectOptions(statusFilter(), "To Do");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(search()).toHaveValue("");
    expect(statusFilter()).toHaveValue("ALL");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    expect(within(column("Done")).getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeDisabled();
  });

  it("keeps the project overview counting all tasks while filtered", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.type(search(), "release");

    expect(overviewStat("Total tasks")).toHaveTextContent(/^5$/);
    expect(overviewStat("In progress")).toHaveTextContent(/^2$/);
  });

  it("saves a status change made while filtered and hides the card that no longer matches", async () => {
    const fetchMock = saveSucceeds();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={mockTasks} />);

    await user.selectOptions(statusFilter(), "To Do");
    await user.selectOptions(screen.getByRole("combobox", { name: "Status for Write release notes" }), "Done");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tasks/t3", expect.objectContaining({ method: "PATCH" }));
    expect(screen.queryByRole("heading", { name: "Write release notes" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 5 tasks");
    await waitFor(() => expect(overviewStat("Completed")).toHaveTextContent(/^1$/));
  });
});

describe("Board: priority", () => {
  beforeEach(() => vi.stubGlobal("fetch", saveSucceeds()));
  afterEach(() => vi.unstubAllGlobals());

  const prioritized: Task[] = [
    { id: "p1", projectId: "demo", title: "Tidy the backlog", status: "TODO", priority: "LOW" },
    { id: "p2", projectId: "demo", title: "Write release notes", status: "TODO", priority: "MEDIUM" },
    { id: "p3", projectId: "demo", title: "Fix login bug", status: "TODO", priority: "HIGH" },
    { id: "p4", projectId: "demo", title: "Review designs", status: "IN_PROGRESS", priority: "HIGH" },
  ];

  function titlesIn(columnName: string) {
    return within(column(columnName))
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
  }

  it("sorts each column High, then Medium, then Low", () => {
    render(<Board projectId="demo" initialTasks={prioritized} />);

    expect(titlesIn("To Do")).toEqual(["Fix login bug", "Write release notes", "Tidy the backlog"]);
  });

  it("shows a priority badge on every card", () => {
    render(<Board projectId="demo" initialTasks={prioritized} />);

    expect(within(column("To Do")).getByText("High priority")).toBeInTheDocument();
    expect(within(column("To Do")).getByText("Medium priority")).toBeInTheDocument();
    expect(within(column("To Do")).getByText("Low priority")).toBeInTheDocument();
  });

  it("filters by priority together with status and search", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={prioritized} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by priority" }), "High");
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Fix login bug",
      "Review designs",
    ]);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by status" }), "In Progress");
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Review designs"]);

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "login");
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0 of 4 tasks");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("combobox", { name: "Filter by priority" })).toHaveValue("ALL");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  it("keeps the overview counting all tasks while filtering by priority", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={prioritized} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by priority" }), "Low");

    expect(overviewStat("Total tasks")).toHaveTextContent(/^4$/);
  });
});

describe("Board: assignees", () => {
  beforeEach(() => vi.stubGlobal("fetch", saveSucceeds()));
  afterEach(() => vi.unstubAllGlobals());

  const members = [
    { userId: "u1", name: "Olivia", email: "olivia@example.com", role: "OWNER" as const },
    { userId: "u2", name: "Mason", email: "mason@example.com", role: "MEMBER" as const },
  ];
  const assigned: Task[] = [
    { id: "a1", projectId: "demo", title: "Write copy", status: "TODO", priority: "MEDIUM", assignee: { userId: "u2", name: "Mason" } },
    { id: "a2", projectId: "demo", title: "Book venue", status: "TODO", priority: "MEDIUM" },
    { id: "a3", projectId: "demo", title: "Plan budget", status: "IN_PROGRESS", priority: "MEDIUM", assignee: { userId: "u1", name: "Olivia" } },
  ];

  it("shows each card's assignee", () => {
    render(<Board projectId="demo" initialTasks={assigned} members={members} />);

    expect(within(column("To Do")).getByText("Assigned to Mason")).toBeInTheDocument();
    expect(within(column("To Do")).getByText("Unassigned")).toBeInTheDocument();
    expect(within(column("In Progress")).getByText("Assigned to Olivia")).toBeInTheDocument();
  });

  it("filters by assignee, including Unassigned, and Clear filters resets it", async () => {
    const user = userEvent.setup();
    render(<Board projectId="demo" initialTasks={assigned} members={members} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by assignee" }), "Mason");
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Write copy"]);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by assignee" }), "Unassigned");
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Book venue"]);
    expect(overviewStat("Total tasks")).toHaveTextContent(/^3$/);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("combobox", { name: "Filter by assignee" })).toHaveValue("ALL");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });
});
