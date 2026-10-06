import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionsTakenSection from "../../src/ActionsTakenSection";

const staff = { id: 7, displayName: "Kamon IT Support", email: "staff@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false };
const assignee = { id: 8, displayName: "Nisa Support", email: "assignee@example.test", role: "IT_STAFF" as const, isActive: true, mustChangePassword: false };
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

  it("shows validation before an incomplete Action is created", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/actions-taken")) return Promise.resolve(response({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }));
      if (url.includes("/staff/assignees")) return Promise.resolve(response([action.performedBy, action.assignedTo]));
      return Promise.resolve(response({}));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ActionsTakenSection ticketId={7} user={staff} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add action" }));
    expect(screen.getByLabelText(/^Action date and time/)).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Save action" }));

    expect(await screen.findByText("Enter an Action description.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Action description/)).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/ }));
    expect(screen.getByRole("button", { name: "Add action" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/staff/tickets/7/actions-taken", expect.objectContaining({ method: "POST" }));
  });

  it("allows an assignee to complete an Action with a transition-only request body", async () => {
    const completed = { ...action, status: "COMPLETED" as const, result: "Service returned to normal operation.", completedAt: "2026-09-27T09:00:00.000Z", version: 2 };
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/actions-taken") && init?.method === "PATCH") return Promise.resolve(response(completed));
      if (url.includes("/actions-taken")) return Promise.resolve(response({ items: [action], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }));
      if (url.includes("/staff/assignees")) return Promise.resolve(response([action.performedBy, action.assignedTo]));
      return Promise.resolve(response({}));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ActionsTakenSection ticketId={7} user={assignee} />);

    fireEvent.click(await screen.findByRole("button", { name: "Complete action" }));
    expect(screen.getByLabelText(/^Result/)).toHaveFocus();
    fireEvent.change(screen.getByLabelText(/^Result/), { target: { value: "Service returned to normal operation." } });
    fireEvent.click(screen.getByRole("button", { name: "Complete action" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/tickets/7/actions-taken/11",
      expect.objectContaining({ method: "PATCH" }),
    ));
    const patch = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/actions-taken/11") && (init as RequestInit | undefined)?.method === "PATCH");
    expect(JSON.parse(String((patch?.[1] as RequestInit).body))).toEqual({
      version: 1,
      status: "COMPLETED",
      result: "Service returned to normal operation.",
    });
  });

  it("loads the next Actions Taken page instead of silently hiding older items", async () => {
    const olderAction = { ...action, id: 10, description: "Documented the earlier investigation", actionAt: "2026-09-26T08:00:00.000Z" };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("page=2")) return Promise.resolve(response({ items: [olderAction], page: 2, pageSize: 10, totalItems: 2, totalPages: 2 }));
      return Promise.resolve(response({ items: [action], page: 1, pageSize: 10, totalItems: 2, totalPages: 2 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ActionsTakenSection ticketId={7} user={requester} readOnly />);

    expect(await screen.findByText("Checked the service logs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more actions" }));

    expect(await screen.findByText("Documented the earlier investigation")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/tickets/7/actions-taken?page=2&pageSize=10", expect.anything());
  });

  it("reloads page one after creating an Action so totals and later pages stay accurate", async () => {
    const initialActions = Array.from({ length: 10 }, (_, index) => ({
      ...action,
      id: index + 1,
      description: `Action ${index + 1}`,
      actionAt: `2026-09-${String(27 - index).padStart(2, "0")}T08:00:00.000Z`,
    }));
    const created = { ...action, id: 12, description: "Newly recorded Action", actionAt: "2026-09-28T08:00:00.000Z" };
    const refreshedFirstPage = [created, ...initialActions.slice(0, 9)];
    const secondPage = initialActions.slice(9).concat({ ...action, id: 11, description: "Oldest Action", actionAt: "2026-09-17T08:00:00.000Z" });
    let actionWasCreated = false;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/actions-taken") && init?.method === "POST") {
        actionWasCreated = true;
        return Promise.resolve(response(created));
      }
      if (url.includes("/staff/assignees")) return Promise.resolve(response([action.performedBy, action.assignedTo]));
      if (url.includes("page=2")) return Promise.resolve(response({ items: secondPage, page: 2, pageSize: 10, totalItems: 12, totalPages: 2 }));
      return Promise.resolve(response(actionWasCreated
        ? { items: refreshedFirstPage, page: 1, pageSize: 10, totalItems: 12, totalPages: 2 }
        : { items: initialActions, page: 1, pageSize: 10, totalItems: 11, totalPages: 2 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ActionsTakenSection ticketId={7} user={staff} />);

    expect(await screen.findByText("Action 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add action" }));
    fireEvent.change(screen.getByLabelText(/^Action date and time/), { target: { value: "2026-09-27T08:00" } });
    fireEvent.change(screen.getByLabelText(/^Assignee/), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText(/^Action description/), { target: { value: "Newly recorded Action" } });
    fireEvent.click(screen.getByRole("button", { name: "Save action" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/staff/tickets/7/actions-taken",
      expect.objectContaining({ method: "POST" }),
    ));
    expect(await screen.findByText("Newly recorded Action")).toBeInTheDocument();
    expect(screen.getByText("Showing 10 of 12 Actions Taken.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more actions" }));

    expect(await screen.findByText("Oldest Action")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(12);
    expect(screen.getByText("Showing 12 of 12 Actions Taken.")).toBeInTheDocument();
  });
});
