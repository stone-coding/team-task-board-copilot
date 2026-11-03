import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectList } from "@/components/projects/ProjectList";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const PROJECTS = [
  { id: "p2", name: "Newest", createdAt: "2026-10-02T00:00:00.000Z" },
  { id: "p1", name: "Oldest", createdAt: "2026-10-01T00:00:00.000Z" },
];

describe("ProjectList", () => {
  it("shows the empty state when there are no projects", () => {
    render(<ProjectList projects={[]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Your projects" })).toBeInTheDocument();
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists projects in the order given (newest first from the API)", () => {
    render(<ProjectList projects={PROJECTS} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent)).toEqual([
      "Newest",
      "Oldest",
    ]);
    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
  });

  it("links each project to its board", () => {
    render(<ProjectList projects={PROJECTS} />);
    expect(screen.getByRole("link", { name: "Newest" })).toHaveAttribute("href", "/projects/p2");
    expect(screen.getByRole("link", { name: "Oldest" })).toHaveAttribute("href", "/projects/p1");
  });
});
