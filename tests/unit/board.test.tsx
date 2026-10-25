import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Board from "@/app/projects/[projectId]/board";
import { mockProject, mockTasks } from "@/lib/mock-tasks";

describe("Board", () => {
  it("renders task columns, counts, and the empty state", () => {
    render(<Board project={mockProject} initialTasks={mockTasks} />);

    expect(screen.getByRole("heading", { name: "Demo Project" })).toBeVisible();
    expect(screen.getByRole("region", { name: "To Do3" })).toHaveTextContent("3");
    expect(screen.getByRole("region", { name: "In Progress2" })).toHaveTextContent("2");
    expect(screen.getByRole("region", { name: "Done0" })).toHaveTextContent("0");
    expect(screen.getByText("No tasks yet")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Status for Write release notes" })).toHaveValue("TODO");
  });

  it("moves a task and updates the column counts", async () => {
    const user = userEvent.setup();
    render(<Board project={mockProject} initialTasks={mockTasks} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status for Write release notes" }),
      "DONE",
    );

    expect(screen.getByRole("combobox", { name: "Status for Write release notes" })).toHaveValue("DONE");
    expect(screen.getByRole("region", { name: "To Do2" })).toHaveTextContent("2");
    expect(screen.getByRole("region", { name: "Done1" })).toHaveTextContent("1");
  });
});