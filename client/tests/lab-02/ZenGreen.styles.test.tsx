import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import "../../src/styles.css";

type MockResponse = { ok: boolean; json: () => Promise<unknown> };

const requester = {
  id: 1,
  displayName: "Anan Chaiyasit",
  email: "anan.chaiyasit@toktickit.local",
};

function response(body: unknown, ok = true): MockResponse {
  return { ok, json: async () => body };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("Zen Green UI style", () => {
  it("keeps the labelled, busy and focusable Ticket controls aligned with the Zen Green tokens", async () => {
    const zenGreenStyles = Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    const categories = deferred<MockResponse>();
    const relatedSystems = deferred<MockResponse>();
    const createTicket = deferred<MockResponse>();

    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith("/api/requesters")) return Promise.resolve(response([requester]));
      if (url.endsWith("/api/categories")) return categories.promise;
      if (url.endsWith("/api/related-systems")) return relatedSystems.promise;
      if (url.endsWith("/api/tickets") && init?.method === "POST") return createTicket.promise;
      return Promise.resolve(response({ message: "Unexpected request" }, false));
    }));

    render(<App />);
    fireEvent.change(await screen.findByLabelText("Development Requester"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "My Tickets" });
    fireEvent.click(screen.getAllByRole("button", { name: "Create Ticket" })[0]);
    await screen.findByRole("heading", { name: "Create Ticket" });

    expect(screen.getByRole("status")).toHaveTextContent("Loading Ticket reference data...");
    expect(screen.getByRole("button", { name: "Submit Ticket" })).toBeDisabled();
    expect(screen.getByLabelText(/^Requested Priority/)).toBeDisabled();
    expect(screen.getByLabelText(/^Category/)).toBeDisabled();
    expect(screen.getByLabelText(/^Related System/)).toBeDisabled();
    expect(screen.getByLabelText(/^Summary/)).toBeDisabled();
    expect(document.querySelectorAll(".required-marker")).toHaveLength(5);

    categories.resolve(response([{ id: 10, name: "Hardware" }]));
    relatedSystems.resolve(response([{ id: 20, name: "Corporate Laptop" }]));

    await waitFor(() => expect(screen.getByRole("button", { name: "Submit Ticket" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/^Requested Priority/), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/^Related System/), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/^Summary/), { target: { value: "Laptop will not charge" } });
    fireEvent.change(screen.getByLabelText(/^Description/), { target: { value: "The charger is connected but the battery percentage does not increase." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByRole("button", { name: "Creating ticket..." })).toBeDisabled();
    expect(screen.getByLabelText(/^Summary/)).toBeDisabled();

    expect(zenGreenStyles).toContain("color: #1f3428;");
    expect(zenGreenStyles).toContain("background: #f5f7f6;");
    expect(zenGreenStyles).toContain(".button-primary { color: #fff; background: #006b3c; }");
    expect(zenGreenStyles).toContain("button:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible");
    expect(zenGreenStyles).toContain("outline: 3px solid #0b7a46;");
    expect(zenGreenStyles).toContain(".required-marker { color: #a22a2a; }");
    expect(zenGreenStyles).toContain("@media (max-width: 767px)");
  });
});
