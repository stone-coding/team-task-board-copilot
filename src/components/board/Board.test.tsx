import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "@/components/board/Board";
import { mockTasks } from "@/lib/mock-tasks";

function column(name: string) {
  return screen.getByRole("region", { name });
}

// The count pill shows only the number; screen readers also hear "tasks".
function count(columnName: string, value: number) {
  return within(column(columnName)).getByText(String(value));
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
    const created = { id: "t9", projectId: "demo", title: "Plan launch", status: "TODO" };
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
    await user.clear(screen.getByRole("textbox", { name: "Title" }));
    await user.type(screen.getByRole("textbox", { name: "Title" }), "Set up the repository");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await within(column("In Progress")).findByRole("heading", { name: "Set up the repository" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Status for Set up the repository" })).toHaveValue("IN_PROGRESS");
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
