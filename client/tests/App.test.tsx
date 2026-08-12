import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

afterEach(() => vi.unstubAllGlobals());

function mockSuccessfulSystemCheck() {
  vi.stubGlobal("fetch", vi.fn((url: string) =>
    Promise.resolve({
      ok: true,
      json: async () =>
        String(url).endsWith("/api/categories")
          ? [{ id: 1, name: "Account and Access" }, { id: 2, name: "Hardware" }, { id: 3, name: "Software" }, { id: 4, name: "Network" }]
          : { status: "ok", service: "TokTickIT API" },
    }),
  ));
}

describe("TokTickIT system check", () => {
  it("renders the heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /TokTickIT IT Service Desk/i })).toBeInTheDocument();
  });

  it("loads categories after checking the system", async () => {
    mockSuccessfulSystemCheck();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /check system/i }));
    expect(await screen.findByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("Hardware");
    expect(screen.getByRole("list")).toHaveTextContent("Software");
    expect(screen.getByRole("list")).toHaveTextContent("Network");
  });

  it("shows a useful error when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unable to connect to TokTickIT API")));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /check system/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to connect to TokTickIT API");
  });
});
