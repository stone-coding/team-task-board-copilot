import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "@/components/auth/LogoutButton";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

describe("LogoutButton", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("clears the session and returns to the login page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LogoutButton />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Log out" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/logout", { method: "POST" });
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
