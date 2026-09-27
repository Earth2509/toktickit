import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionsTakenSection from "../../src/ActionsTakenSection";

const staff = { id: 7, displayName: "Kamon IT Support", email: "staff@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false };
const requester = { id: 2, displayName: "Anan Requester", email: "requester@example.test", role: "REQUESTER" as const, isActive: true, mustChangePassword: false };
const action = {
  id: 11, ticketId: 7, actionAt: "2026-09-27T08:00:00.000Z", completedAt: null, description: "Checked the service logs", result: null,
  status: "OPEN" as const, followUpRequired: true, followUpNote: "Monitor for one business day", attachmentNotes: null, version: 1,
  createdAt: "2026-09-27T08:00:00.000Z", updatedAt: "2026-09-27T08:00:00.000Z", performedBy: { id: 7, displayName: "Kamon IT Support", role: "IT_STAFF" as const }, assignedTo: { id: 8, displayName: "Nisa Support", role: "IT_STAFF" as const },
};

function response(body: unknown) {
  return { ok: true, status: 200, headers: new Headers(), json: async () => body };
}

afterEach(() => vi.unstubAllGlobals());

describe("Lab 4 Actions Taken", () => {
  it("shows Requesters a read-only Action list", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(response({ items: [action], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }))));
    render(<ActionsTakenSection ticketId={7} user={requester} readOnly />);

    expect(await screen.findByText("Checked the service logs")).toBeInTheDocument();
    expect(screen.getByText("Monitor for one business day")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add action" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete action" })).not.toBeInTheDocument();
  });

  it("lets Staff open an Action form with an eligible assignee", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/actions-taken") && init?.method === "POST") return Promise.resolve(response({ ...action, description: "Restarted the service" }));
      if (url.includes("/actions-taken")) return Promise.resolve(response({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }));
      if (url.includes("/staff/assignees")) return Promise.resolve(response([{ id: 7, displayName: "Kamon IT Support", role: "IT_STAFF" }, { id: 8, displayName: "Nisa Support", role: "IT_STAFF" }]));
      return Promise.resolve(response({}));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ActionsTakenSection ticketId={7} user={staff} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add action" }));
    expect(screen.getByLabelText(/^Assignee/)).toHaveValue("7");
    fireEvent.change(screen.getByLabelText(/^Action description/), { target: { value: "Restarted the service" } });
    fireEvent.click(screen.getByRole("button", { name: "Save action" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/tickets/7/actions-taken",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
