import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const categories = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Software" },
  { id: 4, name: "Network" },
];

afterEach(() => vi.unstubAllGlobals());

function mockSuccessfulSystemCheck() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          String(url).endsWith("/api/categories")
            ? categories
            : { status: "ok", service: "TokTickIT API" },
      }),
    ),
  );
}

describe("TokTickIT system check", () => {
  it("renders the heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /TokTickIT IT Service Desk/i }),
    ).toBeInTheDocument();
  });

  it("changes from loading to the category list after checking the system", async () => {
    mockSuccessfulSystemCheck();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check system/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading system status...");

    const categoryItems = await screen.findAllByRole("listitem");
    expect(categoryItems.map((item) => item.textContent)).toEqual(
      categories.map((category) => category.name),
    );
  });

  it("shows a friendly error when the API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check system/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to connect to TokTickIT API");
    expect(alert).not.toHaveTextContent("Failed to fetch");
  });
});
