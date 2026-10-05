import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffTicketDetail from "../../src/StaffTicketDetail";

const staff = { id: 7, displayName: "Kamon Support", email: "staff@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false };
const ticket = {
  id: 9, ticketNumber: "TT-2026-000009", requesterId: 2,
  requester: { id: 2, displayName: "Requester", email: "requester@example.test" },
  category: { id: 1, name: "Hardware" }, relatedSystem: { id: 1, name: "Laptop" },
  summary: "Laptop will not start", description: "The laptop stopped powering on.",
  requestedPriority: "MEDIUM", itPriority: "MEDIUM", currentStatus: "OPEN", version: 4,
  ownerId: 7, owner: staff, attachments: [], requesterResolvedAt: null, resolutionSummary: null,
  createdAt: "2026-09-27T08:00:00.000Z", updatedAt: "2026-09-27T08:00:00.000Z",
};
const original = {
  id: 11, ticketId: 9, actionAt: "2026-09-27T08:00:00.000Z", completedAt: null,
  description: "Checked the service logs", result: null, status: "OPEN", followUpRequired: false,
  followUpNote: null, attachmentNotes: null, version: 1,
  createdAt: "2026-09-27T08:00:00.000Z", updatedAt: "2026-09-27T08:00:00.000Z",
  performedBy: staff, assignedTo: staff,
};
function response(body: unknown, status = 200) {
  return { ok: status < 400, status, headers: new Headers(), json: async () => body };
}
afterEach(() => vi.unstubAllGlobals());

describe("Staff Ticket Detail Action focus integration", () => {
  for (const mode of ["create", "edit", "complete", "cancel"] as const) {
    it(`keeps the real section mounted and restores focus after successful ${mode}`, async () => {
      let items = mode === "create" ? [] : [original];
      let ticketReads = 0;
      let release!: (value: ReturnType<typeof response>) => void;
      const refresh = new Promise<ReturnType<typeof response>>(resolve => { release = resolve; });
      vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url === "/api/tickets/9") return ++ticketReads === 1 ? Promise.resolve(response(ticket)) : refresh;
        if (url === "/api/staff/assignees") return Promise.resolve(response([staff]));
        if (url.includes("actions-taken") && init?.method === "POST") {
          items = [{ ...original, description: "New Action" }];
          return Promise.resolve(response(items[0]));
        }
        if (url.includes("actions-taken") && init?.method === "PATCH") {
          items = [{ ...original, ...JSON.parse(String(init.body)), version: 2 }];
          return Promise.resolve(response(items[0]));
        }
        if (url.includes("actions-taken")) return Promise.resolve(response({ items, page: 1, pageSize: 10, totalItems: items.length, totalPages: 1 }));
        return Promise.resolve(response({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 }));
      }));
      render(<StaffTicketDetail ticketId={9} user={staff} onBack={() => {}} />);
      const add = await screen.findByRole("button", { name: "Add action" });
      const section = screen.getByRole("region", { name: "Actions Taken" });
      await waitFor(() => expect(within(section).queryByText("Loading Actions Taken...")).not.toBeInTheDocument());
      const trigger = mode === "create" ? add : screen.getByRole("button", {
        name: mode === "edit" ? "Edit action" : mode === "complete" ? "Complete action" : "Cancel action",
      });
      fireEvent.click(trigger);
      if (mode === "create" || mode === "edit") {
        fireEvent.change(screen.getByLabelText(/^Action description/), { target: { value: mode === "create" ? "New Action" : "Updated Action" } });
      } else if (mode === "complete") {
        fireEvent.change(screen.getByLabelText(/^Result/), { target: { value: "Service recovered." } });
      }
      fireEvent.click(screen.getByRole("button", {
        name: mode === "complete" ? "Complete action" : mode === "cancel" ? "Cancel action" : "Save action",
      }));
      await waitFor(() => expect(ticketReads).toBe(2));
      expect(section).toBeInTheDocument();
      expect(screen.queryByText("Loading Ticket details...")).not.toBeInTheDocument();
      const expected = screen.getByRole("button", { name: mode === "edit" ? "Edit action" : "Add action" });
      expect(expected).toHaveFocus();
      await act(async () => { release(response({ ...ticket, summary: "Refreshed after Action save", version: 5 })); });
      expect(await screen.findByText("Refreshed after Action save")).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Actions Taken" })).toBe(section);
      expect(expected).toHaveFocus();
      if (mode === "complete" || mode === "cancel") expect(screen.queryByRole("button", { name: mode === "complete" ? "Complete action" : "Cancel action" })).not.toBeInTheDocument();
    });
  }
});
