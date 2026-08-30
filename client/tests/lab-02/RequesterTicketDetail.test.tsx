import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const requester = { id: 1, displayName: "Anan Chaiyasit", email: "anan.chaiyasit@toktickit.local" };
const ticketListItem = {
  id: 42,
  ticketNumber: "TT-2026-000042",
  requesterId: 1,
  category: { id: 10, name: "Hardware" },
  relatedSystem: { id: 20, name: "Corporate Laptop" },
  summary: "Laptop battery drains quickly",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: "2026-08-29T05:00:00.000Z",
  updatedAt: "2026-08-29T06:00:00.000Z",
};
const activeAttachment = {
  id: 8,
  originalFilename: "battery-proof.png",
  mimeType: "image/png",
  sizeBytes: 2048,
  createdAt: "2026-08-29T07:00:00.000Z",
  removedAt: null,
  removedByRequesterId: null,
  removalReason: null,
};
const removedAttachment = {
  ...activeAttachment,
  id: 9,
  originalFilename: "old-proof.pdf",
  mimeType: "application/pdf",
  removedAt: "2026-08-29T08:00:00.000Z",
  removedByRequesterId: 1,
  removalReason: "Duplicate evidence file",
};
const ticketDetail = {
  ...ticketListItem,
  description: "The laptop battery falls from one hundred percent to twenty percent within one hour.",
  requester,
  attachments: [activeAttachment, removedAttachment],
};

type MockResponse = { ok: boolean; json: () => Promise<unknown> };

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function response(body: unknown, ok = true): MockResponse {
  return { ok, json: async () => body };
}

function mockApi() {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    if (url.pathname === "/api/requesters") return Promise.resolve(response([requester]));
    if (url.pathname === "/api/categories") return Promise.resolve(response([{ id: 10, name: "Hardware" }]));
    if (url.pathname === "/api/related-systems") return Promise.resolve(response([{ id: 20, name: "Corporate Laptop" }]));
    if (url.pathname === "/api/tickets") return Promise.resolve(response({ items: [ticketListItem], page: 1, pageSize: 10, totalItems: 1, totalPages: 1 }));
    if (url.pathname === "/api/tickets/42" && !url.pathname.includes("attachments")) return Promise.resolve(response(ticketDetail));
    if (url.pathname === "/api/tickets/42/attachments" && init?.method === "POST") return Promise.resolve(response({ ...activeAttachment, id: 10, originalFilename: "new-proof.png" }));
    if (url.pathname === "/api/tickets/42/attachments/8/remove") return Promise.resolve(response({ ...activeAttachment, removedAt: "2026-08-29T09:00:00.000Z", removedByRequesterId: 1, removalReason: "Duplicate screenshot" }));
    return Promise.resolve(response({ message: "Unexpected request" }, false));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function openDetail() {
  render(<App />);
  fireEvent.change(await screen.findByLabelText("Development Requester"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(await screen.findByRole("button", { name: "My Tickets" }));
  fireEvent.click(await screen.findByRole("button", { name: "View details" }));
  await screen.findByRole("heading", { name: "Ticket Detail" });
}

describe("Requester Ticket Detail", () => {
  it("shows only owned detail data, active and removed metadata, and no removed download action", async () => {
    mockApi();
    await openDetail();

    expect(screen.getByText("TT-2026-000042")).toBeInTheDocument();
    expect(screen.getByText(ticketDetail.description)).toBeInTheDocument();
    expect(screen.getByText("battery-proof.png")).toBeInTheDocument();
    expect(screen.getByText("old-proof.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Removed · Duplicate evidence file/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Download" })).toHaveLength(1);
  });

  it("uploads a permitted file and soft-removes an active attachment with a required reason", async () => {
    const fetchMock = mockApi();
    await openDetail();

    const file = new File(["evidence"], "new-proof.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload an attachment"), { target: { files: [file] } });
    expect(await screen.findByText("new-proof.png was uploaded successfully.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
    expect(await screen.findByText("Enter a removal reason between 5 and 250 characters.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Removal reason"), { target: { value: "Duplicate screenshot" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
    expect(await screen.findByText("battery-proof.png was removed. Its audit metadata is retained.")).toBeInTheDocument();

    await waitFor(() => {
      const upload = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      const removal = fetchMock.mock.calls.find(([input]) => String(input).includes("/attachments/8/remove"));
      expect(upload).toBeTruthy();
      expect(removal).toBeTruthy();
    });
  });
});
