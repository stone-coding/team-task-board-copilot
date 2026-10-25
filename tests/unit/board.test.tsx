import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Board } from "@/components/board/Board";
import { mockTasks } from "@/lib/mock-tasks";

describe("Board", () => {
  it("renders tasks in columns with their counts", () => {
    render(<Board initialTasks={mockTasks} />);

    const todoColumn = screen.getByRole("region", { name: "To Do" });
    const progressColumn = screen.getByRole("region", { name: "In Progress" });
    const doneColumn = screen.getByRole("region", { name: "Done" });

    expect(within(todoColumn).getByText("3")).toBeInTheDocument();
    expect(within(progressColumn).getByText("2")).toBeInTheDocument();
    expect(within(doneColumn).getByText("0")).toBeInTheDocument();
    expect(within(todoColumn).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(within(progressColumn).getByRole("heading", { name: "Set up project repository" })).toBeInTheDocument();
    expect(within(doneColumn).getByText("No tasks yet")).toBeInTheDocument();
  });

  it("moves a task and updates both column counts when its status changes", async () => {
    const user = userEvent.setup();
    render(<Board initialTasks={mockTasks} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status for Draft onboarding checklist" }),
      "IN_PROGRESS",
    );

    const todoColumn = screen.getByRole("region", { name: "To Do" });
    const progressColumn = screen.getByRole("region", { name: "In Progress" });
    expect(within(todoColumn).getByText("2")).toBeInTheDocument();
    expect(within(progressColumn).getByText("3")).toBeInTheDocument();
    expect(within(progressColumn).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(within(todoColumn).queryByRole("heading", { name: "Draft onboarding checklist" })).not.toBeInTheDocument();
  });
});