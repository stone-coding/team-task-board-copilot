import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskFilters } from "@/components/board/TaskFilters";
import { EMPTY_FILTERS } from "@/lib/task-filters";

function filters() {
  return screen.getByRole("search", { name: "Filter tasks" });
}

describe("TaskFilters", () => {
  it("has a search box and a status filter with every status", () => {
    render(<TaskFilters filters={EMPTY_FILTERS} onChange={vi.fn()} shown={5} total={5} />);

    expect(within(filters()).getByRole("searchbox", { name: "Search tasks" })).toHaveValue("");
    const status = within(filters()).getByRole("combobox", { name: "Filter by status" });
    expect(within(status).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "All statuses",
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("has a priority filter with every priority, highest first", () => {
    render(<TaskFilters filters={EMPTY_FILTERS} onChange={vi.fn()} shown={5} total={5} />);

    const priority = within(filters()).getByRole("combobox", { name: "Filter by priority" });
    expect(priority).toHaveValue("ALL");
    expect(within(priority).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "All priorities",
      "High",
      "Medium",
      "Low",
    ]);
  });

  it("reports a chosen priority", async () => {
    const onChange = vi.fn();
    render(<TaskFilters filters={EMPTY_FILTERS} onChange={onChange} shown={5} total={5} />);

    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Filter by priority" }), "High");

    expect(onChange).toHaveBeenCalledWith({ query: "", status: "ALL", priority: "HIGH" });
  });

  it("disables Clear filters and shows no count when no filter is active", () => {
    render(<TaskFilters filters={EMPTY_FILTERS} onChange={vi.fn()} shown={5} total={5} />);

    expect(screen.getByRole("button", { name: "Clear filters" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/^$/);
  });

  it("shows how many tasks match while a filter is active", () => {
    render(<TaskFilters filters={{ query: "notes", status: "ALL", priority: "ALL" }} onChange={vi.fn()} shown={2} total={5} />);

    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 5 tasks");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeEnabled();
  });

  it("reports a typed search and a chosen status", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskFilters filters={EMPTY_FILTERS} onChange={onChange} shown={5} total={5} />);

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "x");
    expect(onChange).toHaveBeenLastCalledWith({ query: "x", status: "ALL", priority: "ALL" });

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter by status" }), "Done");
    expect(onChange).toHaveBeenLastCalledWith({ query: "", status: "DONE", priority: "ALL" });
  });

  it("clears both filters", async () => {
    const onChange = vi.fn();
    render(<TaskFilters filters={{ query: "notes", status: "TODO", priority: "HIGH" }} onChange={onChange} shown={1} total={5} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });
});
