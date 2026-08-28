import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function mockRequesterResponse(body: unknown, ok = true) {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/api/requesters")) {
      return Promise.resolve({ ok, json: async () => body });
    }

    return Promise.resolve({ ok: false, json: async () => ({}) });
  }));
}

describe("TokTickIT application shell", () => {
  it("renders the Development Requester selector", async () => {
    mockRequesterResponse([]);
    render(<App />);

    expect(screen.getByRole("heading", { name: "Development Requester Selection" })).toBeInTheDocument();
    expect(await screen.findByText("No active Development Requesters are available.")).toBeInTheDocument();
  });
});
