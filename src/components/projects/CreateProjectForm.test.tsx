import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function submit(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Project name"), name);
  await user.click(screen.getByRole("button", { name: "Create project" }));
}

describe("CreateProjectForm", () => {
  beforeEach(() => refresh.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it("has a labelled, required name field limited to 80 characters", () => {
    render(<CreateProjectForm />);
    const input = screen.getByLabelText("Project name");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("maxLength", "80");
    expect(screen.getByRole("form", { name: "New project" })).toBeInTheDocument();
  });

  it("creates the project, clears the field, and refreshes the list", async () => {
    const fetchMock = mockFetch(201, { project: { id: "p1", name: "Roadmap", createdAt: "2026-11-02T00:00:00.000Z" } });
    render(<CreateProjectForm />);
    await submit("Roadmap");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Roadmap" }),
    });
    expect(screen.getByLabelText("Project name")).toHaveValue("");
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the API error and keeps the typed name", async () => {
    mockFetch(400, { error: { code: "VALIDATION_ERROR", message: "Project name is required" } });
    render(<CreateProjectForm />);
    await submit("   ");

    expect(screen.getByRole("alert")).toHaveTextContent("Project name is required");
    expect(screen.getByLabelText("Project name")).toHaveValue("   ");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create project" })).toBeEnabled();
  });
});
