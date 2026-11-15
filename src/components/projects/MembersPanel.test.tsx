import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MembersPanel } from "@/components/projects/MembersPanel";
import type { ProjectMemberInfo } from "@/lib/projects";

const refresh = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));

const MEMBERS: ProjectMemberInfo[] = [
  { userId: "u1", name: "Olivia", email: "olivia@example.com", role: "OWNER" },
  { userId: "u2", name: "Mason", email: "mason@example.com", role: "MEMBER" },
];

function panel() {
  return screen.getByRole("region", { name: "Project members" });
}

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("MembersPanel", () => {
  beforeEach(() => {
    refresh.mockReset();
    replace.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("for the owner", () => {
    function renderForOwner() {
      render(<MembersPanel projectId="p1" currentUserId="u1" role="OWNER" members={MEMBERS} />);
      return userEvent.setup();
    }

    it("lists every member with a role and offers Remove for members only", () => {
      renderForOwner();

      const rows = within(panel()).getAllByRole("listitem");
      expect(rows.map((row) => row.textContent)).toEqual([
        expect.stringContaining("Olivia"),
        expect.stringContaining("Mason"),
      ]);
      expect(within(rows[0]).getByText("Owner")).toBeInTheDocument();
      expect(within(rows[1]).getByText("Member")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Mason" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Remove Olivia" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Leave project" })).not.toBeInTheDocument();
    });

    it("adds a member by email, then clears the field and refreshes", async () => {
      const fetchMock = mockFetch(201, { member: { userId: "u3", name: "Nora", email: "nora@example.com", role: "MEMBER" } });
      const user = renderForOwner();

      const form = screen.getByRole("form", { name: "Add member" });
      await user.type(within(form).getByRole("textbox", { name: "Member email" }), "nora@example.com");
      await user.click(within(form).getByRole("button", { name: "Add member" }));

      expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects/p1/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nora@example.com" }),
      });
      expect(refresh).toHaveBeenCalled();
      expect(within(form).getByRole("textbox", { name: "Member email" })).toHaveValue("");
    });

    it("shows the API's message when the email has no account", async () => {
      mockFetch(404, { error: { code: "NOT_FOUND", message: "No account uses this email" } });
      const user = renderForOwner();

      await user.type(screen.getByRole("textbox", { name: "Member email" }), "ghost@example.com");
      await user.click(screen.getByRole("button", { name: "Add member" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("No account uses this email");
      expect(refresh).not.toHaveBeenCalled();
    });

    it("removes a member and refreshes", async () => {
      const fetchMock = mockFetch(204);
      const user = renderForOwner();

      await user.click(screen.getByRole("button", { name: "Remove Mason" }));

      expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects/p1/members/u2", { method: "DELETE" });
      expect(refresh).toHaveBeenCalled();
    });
  });

  describe("for a member", () => {
    function renderForMember() {
      render(<MembersPanel projectId="p1" currentUserId="u2" role="MEMBER" members={MEMBERS} />);
      return userEvent.setup();
    }

    it("shows the members without the add form or Remove buttons", () => {
      renderForMember();

      expect(within(panel()).getAllByRole("listitem")).toHaveLength(2);
      expect(screen.queryByRole("form", { name: "Add member" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    });

    it("leaves the project after confirming and returns to the projects list", async () => {
      const fetchMock = mockFetch(204);
      const user = renderForMember();

      await user.click(screen.getByRole("button", { name: "Leave project" }));
      expect(fetchMock).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Confirm leave" }));

      expect(fetchMock).toHaveBeenCalledWith("/api/v1/projects/p1/members/u2", { method: "DELETE" });
      expect(replace).toHaveBeenCalledWith("/projects");
    });
  });
});
