import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TokTickIT health check", () => {
  it("renders the TokTickIT heading", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /TokTickIT IT Service Desk/i })).toBeInTheDocument();
  });

  it("shows Online after a successful health request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", service: "TokTickIT API" }),
    }));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /check system/i }));

    expect(await screen.findByText("System Status: Online")).toBeInTheDocument();
  });

  it("shows a useful error when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unavailable")));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /check system/i }));

    expect(await screen.findByText("Unable to connect to TokTickIT API")).toBeInTheDocument();
  });
});
