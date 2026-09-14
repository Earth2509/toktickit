import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const requester = { id: 1, displayName: "Anan Chaiyasit", email: "requester1@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false };
const session = { user: requester, csrfToken: "csrf-token", expiresAt: "2026-09-14T00:00:00.000Z" };

function response(body: unknown, ok = true, status = ok ? 200 : 401) {
  return { ok, status, headers: new Headers(), json: async () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("Lab 3 authenticated shell", () => {
  it("shows a neutral startup state and then the public Login without requester selection", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({ code: "UNAUTHENTICATED" }, false))));
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
    expect(await screen.findByRole("heading", { name: "Sign in to TokTickIT" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Development Requester")).not.toBeInTheDocument();
  });

  it("uses safe invalid-login feedback and does not retain the password", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/auth/me")) return Promise.resolve(response({ code: "UNAUTHENTICATED" }, false));
      return Promise.resolve(response({ code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." }, false));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    fireEvent.change(await screen.findByLabelText("Email address"), { target: { value: "requester1@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in. Check your credentials or contact your administrator.");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("gates an initial-password session and opens My Tickets after a valid change", async () => {
    const pending = { ...session, user: { ...requester, mustChangePassword: true } };
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/auth/me")) return Promise.resolve(response(pending));
      if (url.endsWith("/api/auth/change-password")) return Promise.resolve(response(session));
      if (url.includes("/api/categories") || url.includes("/api/related-systems")) return Promise.resolve(response([]));
      if (url.includes("/api/tickets")) return Promise.resolve(response({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }));
      return Promise.resolve(response({}, false));
    }));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Change your initial password" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My Tickets" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "Lab3-Demo-Only!2026" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "A-private-password-2026" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "A-private-password-2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByRole("heading", { name: "My Tickets" })).toBeInTheDocument();
  });

  it("restores requester identity, sends no requesterId, and returns to Login after logout", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(typeof input === "string" ? input : input.toString(), "http://localhost");
      if (url.pathname === "/api/auth/me") return Promise.resolve(response(session));
      if (url.pathname === "/api/auth/logout") return Promise.resolve({ ok: true, status: 204, headers: new Headers(), json: async () => null });
      if (url.pathname === "/api/categories" || url.pathname === "/api/related-systems") return Promise.resolve(response([]));
      if (url.pathname === "/api/tickets") return Promise.resolve(response({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }));
      return Promise.resolve(response({}, false));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect((await screen.findAllByText("Anan Chaiyasit")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Change Requester")).not.toBeInTheDocument();
    const ticketCall = fetchMock.mock.calls.find(([input]) => new URL(typeof input === "string" ? input : input.toString(), "http://localhost").pathname === "/api/tickets");
    expect(new URL(String(ticketCall?.[0]), "http://localhost").searchParams.has("requesterId")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Sign in to TokTickIT" })).toBeInTheDocument());
  });

  it("returns to Login when a protected request reports an expired session", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = new URL(typeof input === "string" ? input : input.toString(), "http://localhost");
      if (url.pathname === "/api/auth/me") return Promise.resolve(response(session));
      return Promise.resolve(response({ code: "UNAUTHENTICATED", message: "Authentication is required." }, false, 401));
    }));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Sign in to TokTickIT" })).toBeInTheDocument();
    expect(screen.queryByText("Anan Chaiyasit")).not.toBeInTheDocument();
  });
});
