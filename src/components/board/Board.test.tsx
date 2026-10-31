import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Board } from "@/components/board/Board";
import { mockTasks } from "@/lib/mock-tasks";

function column(name: string) {
  return screen.getByRole("region", { name });
}

// The count pill shows only the number; screen readers also hear "tasks".
function count(columnName: string, value: number) {
  return within(column(columnName)).getByText(String(value));
}

describe("Board", () => {
  it("shows the columns To Do, In Progress, Done in that order", () => {
    render(<Board initialTasks={mockTasks} />);

    expect(screen.getAllByRole("region")).toHaveLength(3);
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("names each column by its title only, with the count beside the heading", () => {
    render(<Board initialTasks={mockTasks} />);

    expect(screen.getByRole("heading", { level: 2, name: "To Do" })).toBeInTheDocument();
    expect(count("To Do", 3)).toHaveTextContent(/^3 tasks$/);
    expect(count("In Progress", 2)).toHaveTextContent(/^2 tasks$/);
    expect(count("Done", 0)).toHaveTextContent(/^0 tasks$/);
  });

  it("puts each card in the column that matches its status", () => {
    render(<Board initialTasks={mockTasks} />);

    expect(within(column("To Do")).getByRole("heading", { name: "Draft onboarding checklist" })).toBeInTheDocument();
    expect(within(column("To Do")).getAllByRole("listitem")).toHaveLength(3);
    expect(within(column("In Progress")).getByRole("heading", { name: "Set up project repository" })).toBeInTheDocument();
    expect(within(column("In Progress")).getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a card's description only when it has one", () => {
    render(<Board initialTasks={mockTasks} />);

    const withDescription = within(column("To Do")).getAllByRole("listitem")[0];
    const withoutDescription = within(column("To Do")).getAllByRole("listitem")[1];
    expect(within(withDescription).getByText("List the first-week steps for new teammates.")).toBeInTheDocument();
    expect(within(withoutDescription).queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("shows \"No tasks yet\" in an empty column", () => {
    render(<Board initialTasks={mockTasks} />);

    expect(within(column("Done")).getByText("No tasks yet")).toBeInTheDocument();
    expect(within(column("To Do")).queryByText("No tasks yet")).not.toBeInTheDocument();
  });

  it("names each status dropdown after its task and lists the statuses in order", () => {
    render(<Board initialTasks={mockTasks} />);

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
    render(<Board initialTasks={mockTasks} />);

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
    render(<Board initialTasks={mockTasks} />);

    for (const title of ["Set up project repository", "Review sprint backlog"]) {
      await user.selectOptions(screen.getByRole("combobox", { name: `Status for ${title}` }), "Done");
    }

    expect(within(column("In Progress")).getByText("No tasks yet")).toBeInTheDocument();
    expect(count("In Progress", 0)).toHaveTextContent(/^0 tasks$/);
    expect(within(column("Done")).getAllByRole("listitem")).toHaveLength(2);
  });
});
