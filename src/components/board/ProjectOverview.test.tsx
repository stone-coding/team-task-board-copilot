import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectOverview } from "@/components/board/ProjectOverview";

function overview() {
  return screen.getByRole("group", { name: "Project overview" });
}

// Each stat is a <dt> label followed by its <dd> value.
function stat(label: string) {
  return within(overview()).getByText(label, { selector: "dt" }).nextElementSibling;
}

describe("ProjectOverview", () => {
  it("shows total, in-progress, and completed counts and the completion rate", () => {
    render(<ProjectOverview stats={{ total: 5, inProgress: 2, completed: 1, completionRate: 20 }} />);

    expect(stat("Total tasks")).toHaveTextContent(/^5$/);
    expect(stat("In progress")).toHaveTextContent(/^2$/);
    expect(stat("Completed")).toHaveTextContent(/^1$/);
    expect(stat("Completion rate")).toHaveTextContent(/^20%$/);
  });

  it("shows a progress bar for the completed tasks", () => {
    render(<ProjectOverview stats={{ total: 5, inProgress: 2, completed: 1, completionRate: 20 }} />);

    const bar = within(overview()).getByRole("progressbar", { name: "Completion rate" });
    expect(bar).toHaveAttribute("value", "1");
    expect(bar).toHaveAttribute("max", "5");
    expect(within(overview()).getByText("1 of 5 tasks completed")).toBeInTheDocument();
  });

  it("shows zeros and an empty progress bar for a project with no tasks", () => {
    render(<ProjectOverview stats={{ total: 0, inProgress: 0, completed: 0, completionRate: 0 }} />);

    expect(stat("Total tasks")).toHaveTextContent(/^0$/);
    expect(stat("Completion rate")).toHaveTextContent(/^0%$/);
    expect(within(overview()).getByRole("progressbar", { name: "Completion rate" })).toHaveAttribute("value", "0");
    expect(within(overview()).getByText("Add a task to start tracking progress")).toBeInTheDocument();
  });

  it("uses singular wording for a single task", () => {
    render(<ProjectOverview stats={{ total: 1, inProgress: 0, completed: 1, completionRate: 100 }} />);

    expect(within(overview()).getByText("1 of 1 task completed")).toBeInTheDocument();
  });
});
