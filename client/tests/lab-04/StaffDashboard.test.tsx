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
      totalPerformedActions: 0, recentActions: [],
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

  it("shows performed Actions independently of operational Tickets and opens their Ticket", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({
      metrics: { unassignedTickets: 0, ownedByMe: 0, urgentTickets: 0, waitingForRequester: 0 }, recentTickets: [],
      totalPerformedActions: 7, recentActions: [{ id: 33, actionAt: "2026-10-01T10:00:00Z", completedAt: null,
        description: "Work performed by me on another owner's Ticket", status: "OPEN", followUpRequired: true,
        assignedTo: { id: 2, displayName: "Another Staff" }, ticket: { id: 91, ticketNumber: "TT-2026-000091", currentStatus: "CLOSED" } }],
    }))));
    const onViewTicket = vi.fn();
    render(<StaffDashboardView onDrillDown={vi.fn()} onViewTicket={onViewTicket} />);
    expect(await screen.findByRole("heading", { name: "Actions Taken by me" })).toBeInTheDocument();
    expect(screen.getByText(/Showing the latest 1 of 7 Actions/)).toBeInTheDocument();
    expect(screen.getByText("Work performed by me on another owner's Ticket")).toBeInTheDocument();
    expect(screen.getByText(/Assigned to Another Staff/)).toBeInTheDocument();
    expect(screen.getByText("Follow-up required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View Ticket TT-2026-000091 for Action 33" }));
    expect(onViewTicket).toHaveBeenCalledWith(91);
  });

  it("shows the own-Action empty state without suppressing the operational Ticket list", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({
      metrics: { unassignedTickets: 1, ownedByMe: 0, urgentTickets: 0, waitingForRequester: 0 },
      recentTickets: [{ id: 5, ticketNumber: "TT-5", summary: "Operational work", currentStatus: "NEW", itPriority: "LOW", owner: null }],
      totalPerformedActions: 0, recentActions: [],
    }))));
    render(<StaffDashboardView onDrillDown={vi.fn()} onViewTicket={vi.fn()} />);
    expect(await screen.findByText("You have not recorded any Actions Taken yet.")).toBeInTheDocument();
    expect(screen.getByText("Operational work")).toBeInTheDocument();
  });
});
