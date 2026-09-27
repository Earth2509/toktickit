import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StaffDashboardView } from "../../src/Dashboard";

afterEach(() => vi.unstubAllGlobals());
const response = (body: unknown, ok = true, status = ok ? 200 : 503) => ({ ok, status, headers: new Headers(), json: async () => body });

describe("Lab 4 IT Staff Dashboard", () => {
  it("opens exact operational drill-downs and recent Ticket detail", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({
      metrics: { unassignedTickets: 3, ownedByMe: 2, urgentTickets: 4, waitingForRequester: 1 },
      recentTickets: [{ id: 5, ticketNumber: "TT-2026-000005", summary: "Network", currentStatus: "NEW", itPriority: "HIGH", owner: null }],
    }))));
    const onDrillDown = vi.fn(); const onViewTicket = vi.fn();
    render(<StaffDashboardView onDrillDown={onDrillDown} onViewTicket={onViewTicket} />);
    expect(await screen.findByRole("button", { name: "View 3 unassigned Tickets" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View 2 owned by me Tickets" }));
    expect(onDrillDown).toHaveBeenCalledWith({ currentStatus: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"], owner: "me" });
    fireEvent.click(screen.getByRole("button", { name: "View 4 urgent Tickets" }));
    expect(onDrillDown).toHaveBeenCalledWith({ currentStatus: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"], itPriority: ["HIGH", "URGENT"] });
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onViewTicket).toHaveBeenCalledWith(5);
  });

  it("shows a safe failure with Retry", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({ code: "UNAVAILABLE", message: "database internals" }, false))));
    render(<StaffDashboardView onDrillDown={vi.fn()} onViewTicket={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load the Dashboard. Please retry.");
    expect(screen.queryByText("database internals")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
