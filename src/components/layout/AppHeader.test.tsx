import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/AppHeader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

describe("AppHeader", () => {
  it("links the app name to the home page", () => {
    render(<AppHeader />);

    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Team Task Board" })).toHaveAttribute("href", "/");
  });

  it("has a main navigation with a Projects link", () => {
    render(<AppHeader />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
  });

  it("marks Projects as the current page only on the projects page", () => {
    const { rerender } = render(<AppHeader current="projects" />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");

    rerender(<AppHeader />);
    expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("aria-current");
  });

  it("offers a single Log out button", () => {
    render(<AppHeader />);

    expect(within(screen.getByRole("banner")).getAllByRole("button", { name: "Log out" })).toHaveLength(1);
  });

  it("uses no headings, so each page keeps a single <h1>", () => {
    render(<AppHeader />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
