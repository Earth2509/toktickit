import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function mockSessionResponse(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/api/auth/me")) {
      return Promise.resolve({ ok, json: async () => body });
    }

    return Promise.resolve({ ok: false, json: async () => ({}) });
  }));
}

describe("TokTickIT application shell", () => {
  it("renders the public Login without the retired Development Requester selector", async () => {
    mockSessionResponse({ code: "UNAUTHENTICATED" }, false);
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sign in to TokTickIT" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Development Requester")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("autocomplete", "username");
  });
});
