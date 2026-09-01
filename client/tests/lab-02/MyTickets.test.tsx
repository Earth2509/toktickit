import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const requesters = [
  { id: 1, displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local" },
  { id: 2, displayName: "Busaba Wattanakul", email: "busaba.wattanakul@toktickit.local" },
];

const categories = [{ id: 10, name: "Hardware" }];
const relatedSystems = [{ id: 20, name: "Corporate Laptop" }];

const ananTicket = {
  id: 42,
  ticketNumber: "TT-2026-000042",
  requesterId: 1,
  category: categories[0],
  relatedSystem: relatedSystems[0],
  summary: "Laptop battery drains quickly",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: "2026-08-29T05:00:00.000Z",
  updatedAt: "2026-08-29T06:00:00.000Z",
};

const busabaTicket = {
  ...ananTicket,
  id: 43,
  ticketNumber: "TT-2026-000043",
  requesterId: 2,
  summary: "VPN access needs renewal",
};

type MockResponse = { ok: boolean; json: () => Promise<unknown> };

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function response(body: unknown, ok = true): MockResponse {
  return { ok, json: async () => body };
}

function ticketResponse(items: unknown[], page = 1, totalPages = 1, totalItems = items.length) {
  return response({ items, page, pageSize: 10, totalItems, totalPages });
}

function mockApi(ticketHandler: (url: URL) => MockResponse = (url) => {
  const requesterId = url.searchParams.get("requesterId");
  return ticketResponse(requesterId === "2" ? [busabaTicket] : [ananTicket]);
}) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);

    if (url.pathname === "/api/requesters") return Promise.resolve(response(requesters));
    if (url.pathname === "/api/categories") return Promise.resolve(response(categories));
    if (url.pathname === "/api/related-systems") return Promise.resolve(response(relatedSystems));
    if (url.pathname === "/api/tickets") return Promise.resolve(ticketHandler(url));
    return Promise.resolve(response({ message: "Unexpected request" }, false));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openMyTickets(requesterId = "1") {
  render(<App />);
  fireEvent.change(await screen.findByLabelText("Development Requester"), { target: { value: requesterId } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "My Tickets" });
}

describe("My Tickets", () => {
  it("renders only the selected Requester's Tickets and a usable table", async () => {
    const fetchMock = mockApi();
    await openMyTickets();

    expect(await screen.findByText("TT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.queryByText("VPN access needs renewal")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Requested Priority" })).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 1 ticket · Page 1 of 1")).toBeInTheDocument();

    await waitFor(() => {
      const ticketUrl = fetchMock.mock.calls
        .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
        .find((url) => url.pathname === "/api/tickets");
      expect(ticketUrl?.searchParams.get("requesterId")).toBe("1");
      expect(ticketUrl?.searchParams.get("sortBy")).toBe("createdAt");
      expect(ticketUrl?.searchParams.get("sortOrder")).toBe("desc");
    });
  });

  it("sends resettable search and filter controls to the Ticket API", async () => {
    const fetchMock = mockApi();
    await openMyTickets();
    await screen.findByText("TT-2026-000042");

    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "battery" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Related System"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Requested Priority"), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "requestedPriority:asc" } });

    await waitFor(() => {
      const ticketUrls = fetchMock.mock.calls
        .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
        .filter((url) => url.pathname === "/api/tickets");
      const latest = ticketUrls.at(-1)!;
      expect(latest.searchParams.get("search")).toBe("battery");
      expect(latest.searchParams.get("categoryId")).toBe("10");
      expect(latest.searchParams.get("relatedSystemId")).toBe("20");
      expect(latest.searchParams.get("requestedPriority")).toBe("HIGH");
      expect(latest.searchParams.get("sortBy")).toBe("requestedPriority");
      expect(latest.searchParams.get("sortOrder")).toBe("asc");
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      const ticketUrls = fetchMock.mock.calls
        .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
        .filter((url) => url.pathname === "/api/tickets");
      expect(ticketUrls.at(-1)?.searchParams.get("search")).toBeNull();
      expect(screen.getByLabelText("Search tickets")).toHaveValue("");
      expect(screen.getByLabelText("Category")).toHaveValue("");
    });
  });

  it("debounces search input so one completed term produces one Ticket request", async () => {
    const fetchMock = mockApi();
    await openMyTickets();
    await screen.findByText("TT-2026-000042");
    const ticketCallCount = () => fetchMock.mock.calls
      .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
      .filter((url) => url.pathname === "/api/tickets").length;

    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "l" } });
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "la" } });
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "lap" } });
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "lapt" } });
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "lapto" } });
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "laptop" } });

    expect(ticketCallCount()).toBe(1);
    await waitFor(() => expect(ticketCallCount()).toBe(2));
  });

  it("enables Clear filters for a sort-only change and restores the default order", async () => {
    const fetchMock = mockApi();
    await openMyTickets();
    await screen.findByText("TT-2026-000042");

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "ticketNumber:asc" } });
    const clearButton = screen.getByRole("button", { name: "Clear filters" });
    expect(clearButton).toBeEnabled();
    fireEvent.click(clearButton);

    await waitFor(() => {
      const ticketUrls = fetchMock.mock.calls
        .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
        .filter((url) => url.pathname === "/api/tickets");
      expect(ticketUrls.at(-1)?.searchParams.get("sortBy")).toBe("createdAt");
      expect(ticketUrls.at(-1)?.searchParams.get("sortOrder")).toBe("desc");
    });
  });

  it("shows a no-results state separately from an empty requester and returns to page one when filters change", async () => {
    mockApi((url) => {
      if (url.searchParams.get("search") === "unmatched") return ticketResponse([]);
      return ticketResponse([ananTicket], Number(url.searchParams.get("page") ?? "1"), 2, 15);
    });
    await openMyTickets();
    await screen.findByText("TT-2026-000042");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Showing 11–15 of 15 tickets · Page 2 of 2")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search tickets"), { target: { value: "unmatched" } });

    expect(await screen.findByText("No Tickets match your search or filters.")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(await screen.findByText("TT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–10 of 15 tickets · Page 1 of 2")).toBeInTheDocument();
  });

  it("clears the old requester's visible data before loading a new requester", async () => {
    mockApi();
    await openMyTickets();
    expect(await screen.findByText("TT-2026-000042")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change Requester" }));
    fireEvent.change(await screen.findByLabelText("Development Requester"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "My Tickets" }));

    expect(await screen.findByText("TT-2026-000043")).toBeInTheDocument();
    expect(screen.queryByText("TT-2026-000042")).not.toBeInTheDocument();
  });

  it("shows the empty requester state and refreshes the current list", async () => {
    const fetchMock = mockApi(() => ticketResponse([]));
    await openMyTickets();

    expect(await screen.findByText("No Tickets have been created for this Requester yet.")).toBeInTheDocument();
    const ticketCallCount = () => fetchMock.mock.calls
      .map(([input]) => new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url))
      .filter((url) => url.pathname === "/api/tickets").length;
    expect(ticketCallCount()).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(ticketCallCount()).toBe(2));
  });

  it("offers a safe retry message when the Ticket API is unavailable", async () => {
    mockApi((url) => url.searchParams.get("requesterId") === "1"
      ? { ok: false, json: async () => ({ message: "database connection failed" }) }
      : ticketResponse([]));
    await openMyTickets();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Unable to load your Tickets. Please retry.");
    expect(alert).not.toHaveTextContent("database connection failed");
  });
});
