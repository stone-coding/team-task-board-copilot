import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), "correct-horse");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("has labelled email and password fields and a submit button", () => {
    render(<LoginForm nextPath="/" registered={false} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("confirms a new account after registration", () => {
    render(<LoginForm nextPath="/" registered />);
    expect(screen.getByRole("status")).toHaveTextContent("Account created. Log in to continue.");
  });

  it("posts the credentials and navigates to the next path on success", async () => {
    const fetchMock = mockFetch(200, { user: {}, token: "t" });
    render(<LoginForm nextPath="/projects/demo" registered={false} />);
    await fillAndSubmit();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com", password: "correct-horse" }),
      }),
    );
    expect(replace).toHaveBeenCalledWith("/projects/demo");
  });

  it("shows the API error message when login fails", async () => {
    mockFetch(401, { error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" } });
    render(<LoginForm nextPath="/" registered={false} />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect");
    expect(replace).not.toHaveBeenCalled();
  });
});
