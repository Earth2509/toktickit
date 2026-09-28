import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionsTakenSection from "../../src/ActionsTakenSection";
import { RequesterDashboardView } from "../../src/Dashboard";
import "../../src/styles.css";

const staff = {
  id: 7,
  displayName: "Kamon IT Support",
  email: "staff@example.test",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const success = (body: unknown) => ({ ok: true, status: 200, headers: new Headers(), json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe("Lab 4 Zen Green and accessibility contract", () => {
  it("keeps visible focus, 44px targets, wrapping Action text, and 4/2/1 dashboard columns", () => {
    const css = Array.from(document.head.querySelectorAll("style"))
      .map(style => style.textContent ?? "")
      .join("\n");

    expect(css).toContain("button:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible");
    expect(css).toContain("outline: 3px solid #0b7a46;");
    expect(css).toContain(".button { min-height: 44px;");
    expect(css).toContain(".header-nav-button { display: inline-flex; align-items: center; min-height: 44px;");
    expect(css).toContain(".header-account-action { min-height: 44px;");
    expect(css).toContain(".form-field input:not([type=\"file\"]):not([type=\"checkbox\"]), .form-field select, .form-field textarea { width: 100%; min-height: 44px;");
    expect(css).toContain(".checkbox-label { display: inline-flex !important; align-items: center; min-height: 44px;");
    expect(css).toContain(".action-metadata dd { margin: 0; color: #1f3428; line-height: 1.45; overflow-wrap: anywhere; }");
    expect(css).toContain(".dashboard-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(css).toContain("@media (max-width: 991px) {");
    expect(css).toContain(".dashboard-metrics, .dashboard-skeleton-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }");
    expect(css).toContain("@media (max-width: 767px) {");
    expect(css).toContain(".dashboard-metrics, .dashboard-skeleton-grid { grid-template-columns: minmax(0, 1fr); }");
  });

  it("announces loading and exposes labelled, keyboard-focusable dashboard drill-downs", async () => {
    let finishLoading!: (value: ReturnType<typeof success>) => void;
    const pending = new Promise<ReturnType<typeof success>>(resolve => { finishLoading = resolve; });
    vi.stubGlobal("fetch", vi.fn(() => pending));
    render(<RequesterDashboardView onDrillDown={vi.fn()} onViewTicket={vi.fn()} onCreateTicket={vi.fn()} />);

    expect(screen.getByText("Loading Dashboard...").closest('[role="status"]')).toHaveAttribute("aria-busy", "true");
    finishLoading(success({
      metrics: { openTickets: 0, waitingForRequester: 0, recentlyUpdated: 0, recentlyResolved: 0 },
      recentTickets: [],
    }));
    const card = await screen.findByRole("button", { name: "View 0 total open Tickets" });
    expect(card).toHaveAttribute("type", "button");
    expect(card).toHaveClass("dashboard-metric");
    expect(card).toHaveTextContent("No matching Tickets");
    expect(screen.getByText("You have no Tickets yet.")).toBeInTheDocument();
  });

  it("binds Action controls to labels and announces validation in text", async () => {
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/actions-taken")) return Promise.resolve(success({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }));
      if (url.includes("/staff/assignees")) return Promise.resolve(success([{ id: 7, displayName: staff.displayName, role: staff.role }]));
      return Promise.resolve(success({}));
    }));
    render(<ActionsTakenSection ticketId={7} user={staff} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add action" }));
    expect(screen.getByLabelText(/^Action date and time/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Assignee/)).toBeInTheDocument();
    expect(screen.getByLabelText("Follow-up required")).toHaveAttribute("type", "checkbox");
    fireEvent.click(screen.getByRole("button", { name: "Save action" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("id", "action-form-error");
    expect(alert).toHaveTextContent("Enter an Action description.");
    expect(screen.getByLabelText(/^Action description/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Action description/)).toHaveAttribute("aria-describedby", "action-form-error");
  });
});
