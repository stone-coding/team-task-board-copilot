import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommentThread } from "@/components/board/CommentThread";

const COMMENTS = [
  { id: "c1", taskId: "t1", body: "Draft is ready", createdAt: "2026-11-15T17:05:00.000Z", author: { userId: "u1", name: "Olivia" } },
  { id: "c2", taskId: "t1", body: "I'll review it", createdAt: "2026-11-15T17:20:00.000Z", author: { userId: "u2", name: "Mason" } },
];

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function renderThread({ currentUserId = "u2", canModerate = false } = {}) {
  render(<CommentThread taskId="t1" taskTitle="Write copy" currentUserId={currentUserId} canModerate={canModerate} />);
  return userEvent.setup();
}

function thread() {
  return screen.getByRole("region", { name: "Comments on Write copy" });
}

describe("CommentThread", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the comments and shows author, time, and text, oldest first", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(200, { comments: COMMENTS }));
    vi.stubGlobal("fetch", fetchMock);
    renderThread();

    const items = await within(thread()).findAllByRole("listitem");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/tasks/t1/comments");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("Olivia")).toBeInTheDocument();
    expect(within(items[0]).getByText("Draft is ready")).toBeInTheDocument();
    expect(items[0].querySelector("time")).toHaveAttribute("dateTime", "2026-11-15T17:05:00.000Z");
    expect(within(items[1]).getByText("I'll review it")).toBeInTheDocument();
  });

  it("says when there are no comments yet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(200, { comments: [] })));
    renderThread();

    expect(await within(thread()).findByText("No comments yet")).toBeInTheDocument();
  });

  it("posts a comment, shows it, and clears the box", async () => {
    const posted = { id: "c3", taskId: "t1", body: "Ship it", createdAt: "2026-11-15T18:00:00.000Z", author: { userId: "u2", name: "Mason" } };
    const fetchMock = vi.fn().mockResolvedValueOnce(respond(200, { comments: [] })).mockResolvedValueOnce(respond(201, { comment: posted }));
    vi.stubGlobal("fetch", fetchMock);
    const user = renderThread();
    await within(thread()).findByText("No comments yet");

    const form = screen.getByRole("form", { name: "Comment on Write copy" });
    await user.type(within(form).getByRole("textbox", { name: "Add a comment" }), "Ship it");
    await user.click(within(form).getByRole("button", { name: "Post comment" }));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/v1/tasks/t1/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "Ship it" }),
    });
    expect(await within(thread()).findByText("Ship it")).toBeInTheDocument();
    expect(within(form).getByRole("textbox", { name: "Add a comment" })).toHaveValue("");
  });

  it("shows the API's message when posting fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(respond(200, { comments: [] }))
        .mockResolvedValueOnce(respond(400, { error: { code: "VALIDATION_ERROR", message: "Comment cannot be empty" } })),
    );
    const user = renderThread();
    await within(thread()).findByText("No comments yet");

    await user.type(screen.getByRole("textbox", { name: "Add a comment" }), " ");
    await user.click(screen.getByRole("button", { name: "Post comment" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Comment cannot be empty");
  });

  it("offers Delete only on the viewer's own comments", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(200, { comments: COMMENTS })));
    renderThread({ currentUserId: "u2" });

    const items = await within(thread()).findAllByRole("listitem");
    expect(within(items[0]).queryByRole("button", { name: /Delete comment/ })).not.toBeInTheDocument();
    expect(within(items[1]).getByRole("button", { name: "Delete comment by Mason" })).toBeInTheDocument();
  });

  it("lets the owner delete anyone's comment", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(respond(200, { comments: COMMENTS })).mockResolvedValueOnce(respond(204));
    vi.stubGlobal("fetch", fetchMock);
    const user = renderThread({ currentUserId: "u1", canModerate: true });

    const items = await within(thread()).findAllByRole("listitem");
    await user.click(within(items[1]).getByRole("button", { name: "Delete comment by Mason" }));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/v1/comments/c2", { method: "DELETE" });
    expect(await within(thread()).findAllByRole("listitem")).toHaveLength(1);
  });

  it("shows an error when the comments cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(404, { error: { code: "NOT_FOUND", message: "Task not found" } })));
    renderThread();

    expect(await screen.findByRole("alert")).toHaveTextContent("Task not found");
  });
});
