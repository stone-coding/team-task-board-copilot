import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectListItem } from "@/components/projects/ProjectListItem";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const PROJECT = { id: "p1", name: "Roadmap", createdAt: "2026-10-01T00:00:00.000Z" };

function renderItem() {
  render(
    <ul>
      <ProjectListItem project={PROJECT} />
    </ul>,
  );
  return userEvent.setup();
}

describe("ProjectListItem", () => {
  beforeEach(() => refresh.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it("asks for confirmation before deleting and moves focus to Cancel", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));

    expect(screen.getByText("Delete this project and all its tasks?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm delete Roadmap" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel deleting Roadmap" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the project when the deletion is cancelled and returns focus to Delete", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Cancel deleting Roadmap" }));

    expect(screen.queryByRole("button", { name: "Confirm delete Roadmap" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Roadmap" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("deletes the project after confirmation and refreshes the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Roadmap" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects/p1", { method: "DELETE" });
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps the confirmation disabled while the list refreshes after deleting", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Roadmap" }));

    expect(screen.getByRole("button", { name: "Confirm delete Roadmap" })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error and keeps the project when deletion fails", async () => {
    const body = { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 500 })));
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Roadmap" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
    expect(screen.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows an error and allows retrying when the delete request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const user = renderItem();

    await user.click(screen.getByRole("button", { name: "Delete Roadmap" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Roadmap" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
    expect(screen.getByRole("button", { name: "Confirm delete Roadmap" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Roadmap" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
