import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("TokTickIT application shell", () => {
  it("renders the Development Requester selector", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    render(<App />);

    expect(screen.getByRole("heading", { name: "Development Requester Selection" })).toBeInTheDocument();
    expect(await screen.findByText("No active Development Requesters are available.")).toBeInTheDocument();
  });
});
