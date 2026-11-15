import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskCard } from "@/components/board/TaskCard";
import type { Task } from "@/lib/tasks";

const task: Task = { id: "t1", projectId: "p1", title: "Write release notes", description: "For v1", status: "TODO" };

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderCard(overrides: { onSaved?: (task: Task) => void; onDeleted?: (taskId: string) => void } = {}) {
  const props = { onStatusChange: vi.fn(), onSaved: vi.fn(), onDeleted: vi.fn(), ...overrides };
  render(
    <ul>
      <TaskCard task={task} {...props} />
    </ul>,
  );
  return props;
}

describe("TaskCard editing", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens an edit form filled with the task's title and description, focused on the title", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Write release notes" }));

    expect(screen.getByRole("form", { name: "Edit Write release notes" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Write release notes");
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Description (optional)" })).toHaveValue("For v1");
  });

  it("saves the edited title and description with PATCH and reports the saved task", async () => {
    const saved = { ...task, title: "Write the release notes", description: "" };
    const fetchMock = mockFetch(200, { task: { id: "t1", projectId: "p1", title: "Write the release notes", status: "TODO" } });
    const user = userEvent.setup();
    const { onSaved } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Write release notes" }));
    await user.clear(screen.getByRole("textbox", { name: "Title" }));
    await user.type(screen.getByRole("textbox", { name: "Title" }), saved.title);
    await user.clear(screen.getByRole("textbox", { name: "Description (optional)" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tasks/t1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Write the release notes", description: "" }),
    });
    expect(onSaved).toHaveBeenCalledWith({ id: "t1", projectId: "p1", title: "Write the release notes", status: "TODO" });
  });

  it("announces an empty title without calling the API", async () => {
    const fetchMock = mockFetch(200, {});
    const user = userEvent.setup();
    const { onSaved } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Write release notes" }));
    await user.clear(screen.getByRole("textbox", { name: "Title" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Task title is required");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("announces a failed save and keeps the form open", async () => {
    mockFetch(500, { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } });
    const user = userEvent.setup();
    const { onSaved } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Write release notes" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
    expect(screen.getByRole("form", { name: "Edit Write release notes" })).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("cancels editing and returns focus to the Edit button", async () => {
    const fetchMock = mockFetch(200, {});
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "Edit Write release notes" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Write release notes" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("TaskCard deleting", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks for confirmation and deletes nothing when cancelled", async () => {
    const fetchMock = mockFetch(204);
    const user = userEvent.setup();
    const { onDeleted } = renderCard();

    await user.click(screen.getByRole("button", { name: "Delete Write release notes" }));
    expect(screen.getByText("Delete this task?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel deleting Write release notes" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel deleting Write release notes" }));

    expect(screen.queryByText("Delete this task?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Write release notes" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("deletes the task through the API after confirming", async () => {
    const fetchMock = mockFetch(204);
    const user = userEvent.setup();
    const { onDeleted } = renderCard();

    await user.click(screen.getByRole("button", { name: "Delete Write release notes" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Write release notes" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tasks/t1", { method: "DELETE" });
    expect(onDeleted).toHaveBeenCalledWith("t1");
  });

  it("announces a failed delete and keeps the card", async () => {
    mockFetch(404, { error: { code: "NOT_FOUND", message: "Task not found" } });
    const user = userEvent.setup();
    const { onDeleted } = renderCard();

    await user.click(screen.getByRole("button", { name: "Delete Write release notes" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Write release notes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Task not found");
    expect(screen.getByRole("heading", { name: "Write release notes" })).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
