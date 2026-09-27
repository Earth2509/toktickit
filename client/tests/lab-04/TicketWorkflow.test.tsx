import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ActionsTakenSection", () => ({ default: () => null }));
vi.mock("../../src/DiscussionPanel", () => ({ default: () => null }));

import StaffTicketDetail from "../../src/StaffTicketDetail";

const staff = { id: 7, displayName: "Kamon Support", email: "staff@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false };
const ticket = {
  id: 9, ticketNumber: "TT-2026-000009", requesterId: 2,
  requester: { id: 2, displayName: "Requester", email: "requester@example.test" },
  category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Laptop" },
  summary: "Laptop will not start", description: "The laptop stopped powering on.",
  requestedPriority: "MEDIUM", itPriority: "MEDIUM", currentStatus: "OPEN", version: 4,
  ownerId: 7, owner: { id: 7, displayName: "Kamon Support", role: "IT_STAFF", isActive: true },
  attachments: [], requesterResolvedAt: null, resolutionSummary: null,
  createdAt: "2026-09-27T08:00:00.000Z", updatedAt: "2026-09-27T08:00:00.000Z",
};

function response(body: unknown, status = 200) {
  return { ok: status < 400, status, headers: new Headers(), json: async () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("Lab 4 Ticket resolution UI", () => {
  it("shows the server's actionable resolution-gate message instead of hiding it behind a generic conflict", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/tickets/9")) return Promise.resolve(response(ticket));
      if (url.endsWith("/api/staff/assignees")) return Promise.resolve(response([staff]));
      if (url.endsWith("/api/staff/tickets/9/status") && init?.method === "PATCH") {
        return Promise.resolve(response({ code: "CONFLICT", message: "Complete or cancel every open Action Taken before resolving this Ticket." }, 409));
      }
      return Promise.resolve(response({}));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<StaffTicketDetail ticketId={9} user={staff} onBack={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Next status"), { target: { value: "RESOLVED" } });
    fireEvent.change(screen.getByLabelText("Resolution summary"), { target: { value: "Service restored and verified." } });
    fireEvent.click(screen.getByRole("button", { name: "Update status" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Complete or cancel every open Action Taken before resolving this Ticket.");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/tickets/9/status",
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining('"currentStatus":"RESOLVED"') }),
    ));
  });

  it("still provides a reload instruction for a stale Ticket version", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/tickets/9")) return Promise.resolve(response(ticket));
      if (url.endsWith("/api/staff/assignees")) return Promise.resolve(response([staff]));
      if (url.endsWith("/api/staff/tickets/9/status") && init?.method === "PATCH") {
        return Promise.resolve(response({ code: "CONFLICT", message: "This Ticket changed. Reload it before trying again." }, 409));
      }
      return Promise.resolve(response({}));
    }));
    render(<StaffTicketDetail ticketId={9} user={staff} onBack={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Next status"), { target: { value: "RESOLVED" } });
    fireEvent.change(screen.getByLabelText("Resolution summary"), { target: { value: "Service restored and verified." } });
    fireEvent.click(screen.getByRole("button", { name: "Update status" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This Ticket changed. Reload and try again.");
  });
});
