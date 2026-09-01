import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const requesters = [{ id: 1, displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local" }];
const categories = [{ id: 10, name: "Hardware" }];
const relatedSystems = [{ id: 20, name: "Corporate Laptop" }];

type MockResponse = { ok: boolean; json: () => Promise<unknown> };

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function response(body: unknown, ok = true): MockResponse {
  return { ok, json: async () => body };
}

function mockApi(createResponses: MockResponse[] = [response(createdTicket)]) {
  let createAttempt = 0;
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.endsWith("/api/requesters")) return Promise.resolve(response(requesters));
    if (url.endsWith("/api/categories")) return Promise.resolve(response(categories));
    if (url.endsWith("/api/related-systems")) return Promise.resolve(response(relatedSystems));
    if (url.endsWith("/api/tickets") && init?.method === "POST") {
      return Promise.resolve(createResponses[createAttempt++] ?? createResponses.at(-1)!);
    }
    return Promise.resolve(response({ message: "Unexpected request" }, false));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openCreateTicket() {
  render(<App />);
  fireEvent.change(await screen.findByLabelText("Development Requester"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "My Tickets" });
  fireEvent.click(screen.getAllByRole("button", { name: "Create Ticket" })[1]);
  await screen.findByRole("heading", { name: "Create Ticket" });
  await screen.findByRole("option", { name: "Hardware" });
}

function completeValidTicketForm() {
  fireEvent.change(screen.getByLabelText(/^Requested Priority/), { target: { value: "HIGH" } });
  fireEvent.change(screen.getByLabelText(/^Category/), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText(/^Related System/), { target: { value: "20" } });
  fireEvent.change(screen.getByLabelText(/^Summary/), { target: { value: "Laptop will not charge" } });
  fireEvent.change(screen.getByLabelText(/^Description/), { target: { value: "The charger is connected but the battery percentage does not increase." } });
}

const createdTicket = {
  id: 42,
  ticketNumber: "TT-2026-000042",
  requesterId: 1,
  category: categories[0],
  relatedSystem: relatedSystems[0],
  summary: "Laptop will not charge",
  description: "The charger is connected but the battery percentage does not increase.",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: "2026-08-29T05:00:00.000Z",
  updatedAt: "2026-08-29T05:00:00.000Z",
};

describe("Create Ticket", () => {
  it("shows inline validation and does not call the create API for an incomplete form", async () => {
    const fetchMock = mockApi();
    await openCreateTicket();

    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByText("Select a Category.")).toBeInTheDocument();
    expect(screen.getByText("Enter 5-120 characters.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")).toHaveLength(0);
  });

  it("submits the selected Requester data once and shows the backend Ticket number after success", async () => {
    const fetchMock = mockApi();
    await openCreateTicket();
    completeValidTicketForm();

    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByRole("heading", { name: "Your request has been created" })).toBeInTheDocument();
    expect(screen.getByText("TT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText(/Attachments were validated locally but are not uploaded in this step/)).toBeInTheDocument();
    const postCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "POST");
    expect(postCall).toBeDefined();
    const postedBody = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(postedBody).toMatchObject({ requesterId: 1, categoryId: 10, relatedSystemId: 20, requestedPriority: "HIGH" });
    expect(postedBody.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("preserves entered values after a recoverable API failure and allows the same Ticket to be retried", async () => {
    const fetchMock = mockApi([
      response({ message: "Ticket validation failed", fieldErrors: { summary: "Summary needs more context." } }, false),
      response(createdTicket),
    ]);
    await openCreateTicket();
    completeValidTicketForm();
    const validFile = new File(["evidence"], "battery-photo.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Attachments"), { target: { files: [validFile] } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByText("Ticket validation failed")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Summary/)).toHaveValue("Laptop will not charge");
    expect(screen.getByText(/battery-photo\.pdf/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByText("TT-2026-000042")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")).toHaveLength(2);
  });

  it("keeps permitted attachments and names every rejected file in a mixed selection", async () => {
    mockApi();
    await openCreateTicket();
    const validFile = new File(["evidence"], "evidence.png", { type: "image/png" });
    const invalidFile = new File(["not an attachment"], "notes.txt", { type: "text/plain" });
    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "oversized.pdf", { type: "application/pdf" });

    fireEvent.change(screen.getByLabelText("Attachments"), { target: { files: [validFile, invalidFile, oversizedFile] } });

    expect(await screen.findByText(/notes\.txt: unsupported file type/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("notes.txt");
    expect(screen.getByRole("alert")).toHaveTextContent("oversized.pdf");
    expect(screen.getByLabelText("Selected valid files")).toHaveTextContent("evidence.png");
    expect(screen.getByLabelText("Selected valid files")).not.toHaveTextContent("notes.txt");
  });

  it("validates an overlong Summary instead of silently truncating it", async () => {
    const fetchMock = mockApi();
    await openCreateTicket();
    completeValidTicketForm();
    fireEvent.change(screen.getByLabelText(/^Summary/), { target: { value: "A".repeat(121) } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    expect(await screen.findByText("Enter 5-120 characters.")).toBeInTheDocument();
    expect(screen.getByText("121/120 characters")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")).toHaveLength(0);
  });
});
