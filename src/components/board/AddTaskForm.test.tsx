import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddTaskForm } from "@/components/board/AddTaskForm";

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("AddTaskForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("has a labelled title limited to 120 characters and an optional description", () => {
    render(<AddTaskForm projectId="p1" onCreated={vi.fn()} />);

    expect(screen.getByRole("form", { name: "Add task" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveAttribute("maxLength", "120");
    expect(screen.getByRole("textbox", { name: "Description (optional)" })).toHaveAttribute("maxLength", "2000");
    expect(screen.getByRole("button", { name: "Add task" })).toHaveAttribute("type", "submit");
  });

  it("creates the task through the API, reports it, and clears the form", async () => {
    const task = { id: "t9", projectId: "p1", title: "Plan launch", description: "Dates and owners", status: "TODO" };
    const fetchMock = mockFetch(201, { task });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskForm projectId="p1" onCreated={onCreated} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "Plan launch");
    await user.type(screen.getByRole("textbox", { name: "Description (optional)" }), "Dates and owners");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects/p1/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Plan launch", description: "Dates and owners" }),
    });
    expect(onCreated).toHaveBeenCalledWith(task);
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Description (optional)" })).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces a missing title without calling the API", async () => {
    const fetchMock = mockFetch(201, {});
    const user = userEvent.setup();
    render(<AddTaskForm projectId="p1" onCreated={vi.fn()} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "   ");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Task title is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("announces the API's error message and keeps what was typed", async () => {
    mockFetch(404, { error: { code: "NOT_FOUND", message: "Project not found" } });
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<AddTaskForm projectId="p1" onCreated={onCreated} />);

    await user.type(screen.getByRole("textbox", { name: "Title" }), "Plan launch");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Project not found");
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Plan launch");
    expect(onCreated).not.toHaveBeenCalled();
  });
});
