import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const requesters = [
  { id: 1, displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local" },
  { id: 2, displayName: "Busaba Wattanakul", email: "busaba.wattanakul@toktickit.local" },
];

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

describe("Development Requester Selection", () => {
  it("shows only fetched active Requesters and explains that this is not login", async () => {
    mockRequesterResponse(requesters);
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading Development Requesters");
    expect(await screen.findByRole("option", { name: /Anan Chaiyasit/ })).toBeInTheDocument();
    expect(screen.getByText(/This is not a login screen/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("persists the selected Requester and refreshes the list when the user changes it", async () => {
    const refreshedRequesters = [requesters[0]];
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (!url.endsWith("/api/requesters")) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }

      const body = fetchMock.mock.calls.length === 1 ? requesters : refreshedRequesters;
      return Promise.resolve({ ok: true, json: async () => body });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    const selector = await screen.findByLabelText("Development Requester");
    fireEvent.change(selector, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Requester Workspace" })).toBeInTheDocument();
    expect(screen.getAllByText("Busaba Wattanakul").length).toBeGreaterThan(0);
    expect(window.localStorage.getItem("toktickit.lab2.developmentRequesterId")).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "Change Requester" }));

    expect(await screen.findByRole("heading", { name: "Development Requester Selection" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("option", { name: /Busaba Wattanakul/ })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("toktickit.lab2.developmentRequesterId")).toBeNull();
  });

  it("shows a safe retry message when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<App />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to load Development Requesters. Please retry.");
    expect(alert).not.toHaveTextContent("Failed to fetch");

    mockRequesterResponse(requesters);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByLabelText("Development Requester")).toBeInTheDocument());
  });
});
