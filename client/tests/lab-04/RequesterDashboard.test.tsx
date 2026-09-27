import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequesterDashboardView } from "../../src/Dashboard";

afterEach(() => vi.unstubAllGlobals());
const success = (body: unknown) => ({ ok: true, status: 200, headers: new Headers(), json: async () => body });

describe("Lab 4 Requester Dashboard", () => {
  it("shows four own Ticket metrics, a recent row, and exact drill-down filters", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(success({
      metrics: { openTickets: 3, waitingForRequester: 1, recentlyUpdated: 4, recentlyResolved: 2 },
      recentTickets: [{ id: 9, ticketNumber: "TT-2026-000009", summary: "Printer issue", currentStatus: "OPEN" }],
    }))));
    const onDrillDown = vi.fn(); const onViewTicket = vi.fn();
    render(<RequesterDashboardView onDrillDown={onDrillDown} onViewTicket={onViewTicket} onCreateTicket={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "View 3 total open Tickets" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View 2 recently resolved Tickets" }));
    expect(onDrillDown).toHaveBeenCalledWith({ currentStatus: ["RESOLVED", "CLOSED"], resolvedWithinDays: 30 });
    fireEvent.click(screen.getByRole("button", { name: "View 4 recently updated Tickets" }));
    expect(onDrillDown).toHaveBeenCalledWith({ updatedWithinDays: 30, sort: "recent" });
    fireEvent.click(screen.getByRole("button", { name: "View details" }));
    expect(onViewTicket).toHaveBeenCalledWith(9);
  });

  it("shows explicit zero state and a Create Ticket path", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(success({
      metrics: { openTickets: 0, waitingForRequester: 0, recentlyUpdated: 0, recentlyResolved: 0 }, recentTickets: [],
    }))));
    const onCreateTicket = vi.fn();
    render(<RequesterDashboardView onDrillDown={vi.fn()} onViewTicket={vi.fn()} onCreateTicket={onCreateTicket} />);
    expect(await screen.findByText("You have no Tickets yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Ticket" }));
    expect(onCreateTicket).toHaveBeenCalledOnce();
  });
});
