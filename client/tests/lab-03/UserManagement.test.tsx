import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserManagement from "../../src/UserManagement";

const administrator = {
  id: 9,
  displayName: "System Administrator",
  email: "admin@example.test",
  role: "ADMINISTRATOR" as const,
  isActive: true,
  mustChangePassword: false,
  credentialVersion: 1,
  version: 1,
  createdAt: "2026-09-17T00:00:00.000Z",
  updatedAt: "2026-09-17T00:00:00.000Z",
};

function response(body: unknown) {
  return { ok: true, status: 200, headers: new Headers(), json: async () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("Lab 3 Administrator user management", () => {
  it("loads safe user records, combines filters, and protects self-deactivation in the edit form", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => Promise.resolve(response({ items: [administrator] })));
    vi.stubGlobal("fetch", fetchMock);
    render(<UserManagement currentUser={administrator} onSessionInvalidated={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "User Management" })).toBeInTheDocument();
    expect(screen.getByText("System Administrator")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search name or email"), { target: { value: "system" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "ADMINISTRATOR" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/users?search=system&role=ADMINISTRATOR", expect.anything()));

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("checkbox", { name: "Active account" })).toBeDisabled();
    expect(screen.getByText("You cannot deactivate your own account.")).toBeInTheDocument();
  });
});
