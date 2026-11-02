import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/RegisterForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillAndSubmit(password = "correct-horse") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("RegisterForm", () => {
  beforeEach(() => push.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it("tells the user the password needs 8+ characters", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");
    expect(screen.getByText("At least 8 characters.")).toBeInTheDocument();
  });

  it("redirects to the login page after a successful registration", async () => {
    const fetchMock = mockFetch(201, { user: {} });
    render(<RegisterForm />);
    await fillAndSubmit();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse" }),
      }),
    );
    expect(push).toHaveBeenCalledWith("/login?registered=1");
  });

  it("shows the duplicate-email message from the API", async () => {
    mockFetch(409, { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } });
    render(<RegisterForm />);
    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("An account with this email already exists");
    expect(push).not.toHaveBeenCalled();
  });
});
