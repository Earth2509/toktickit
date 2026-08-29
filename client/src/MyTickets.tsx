import { useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  fetchRelatedSystems,
  fetchTickets,
  requestedPriorities,
  type Category,
  type RelatedSystem,
  type Requester,
  type RequestedPriority,
  type TicketListResponse,
} from "./api";

type MyTicketsProps = {
  requester: Requester;
  onCreateTicket: () => void;
};

type TicketFilters = {
  search: string;
  categoryId: string;
  relatedSystemId: string;
  requestedPriority: "" | RequestedPriority;
  sort: "createdAt:desc" | "updatedAt:desc" | "updatedAt:asc" | "ticketNumber:asc" | "ticketNumber:desc" | "requestedPriority:asc" | "requestedPriority:desc";
};

const initialFilters: TicketFilters = {
  search: "",
  categoryId: "",
  relatedSystemId: "",
  requestedPriority: "",
  sort: "createdAt:desc",
};

export default function MyTickets({ requester, onCreateTicket }: MyTicketsProps) {
  const [filters, setFilters] = useState<TicketFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [page, setPage] = useState(1);
  const [referenceData, setReferenceData] = useState<{ categories: Category[]; relatedSystems: RelatedSystem[] }>({
    categories: [],
    relatedSystems: [],
  });
  const [results, setResults] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  const [sortBy, sortOrder] = filters.sort.split(":") as ["createdAt" | "updatedAt" | "ticketNumber" | "requestedPriority", "asc" | "desc"];
  const hasSearchOrFilters = Boolean(searchInput.trim() || filters.categoryId || filters.relatedSystemId || filters.requestedPriority);
  const hasModifiedControls = hasSearchOrFilters || filters.sort !== initialFilters.sort;

  useEffect(() => {
    let active = true;

    void Promise.all([fetchCategories(), fetchRelatedSystems()])
      .then(([categories, relatedSystems]) => {
        if (active) setReferenceData({ categories, relatedSystems });
      })
      .catch(() => {
        if (active) setReferenceData({ categories: [], relatedSystems: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const searchTimer = window.setTimeout(() => {
      setFilters((current) => current.search === searchInput ? current : { ...current, search: searchInput });
      setPage(1);
    }, 300);

    return () => window.clearTimeout(searchTimer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResults(null);

    void fetchTickets({
      requesterId: requester.id,
      search: filters.search,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      relatedSystemId: filters.relatedSystemId ? Number(filters.relatedSystemId) : undefined,
      requestedPriority: filters.requestedPriority || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: 10,
    })
      .then((response) => {
        if (active) setResults(response);
      })
      .catch(() => {
        if (active) setError("Unable to load your Tickets. Please retry.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, page, reloadVersion, requester.id, sortBy, sortOrder]);

  const pageSummary = useMemo(() => {
    if (!results) return "";
    const firstResult = (results.page - 1) * results.pageSize + 1;
    const lastResult = Math.min(results.page * results.pageSize, results.totalItems);
    const ticketLabel = results.totalItems === 1 ? "ticket" : "tickets";
    return `Showing ${firstResult}–${lastResult} of ${results.totalItems} ${ticketLabel} · Page ${results.page} of ${results.totalPages}`;
  }, [results]);

  function updateFilters(update: Partial<TicketFilters>) {
    setFilters((current) => ({ ...current, ...update }));
    setPage(1);
  }

  function clearFilters() {
    setSearchInput(initialFilters.search);
    setFilters(initialFilters);
    setPage(1);
  }

  return (
    <section className="ticket-card ticket-list-card" aria-labelledby="my-tickets-heading">
      <div className="ticket-card-heading">
        <div>
          <p className="section-kicker">Requester workspace</p>
          <h1 id="my-tickets-heading">My Tickets</h1>
          <p>Review Tickets that belong to <strong>{requester.displayName}</strong>.</p>
        </div>
        <button className="button button-primary" type="button" onClick={onCreateTicket}>Create Ticket</button>
      </div>

      <div className="ticket-toolbar" aria-label="Ticket search and filters">
        <div className="ticket-filter search-filter">
          <label htmlFor="ticket-search">Search tickets</label>
          <input
            id="ticket-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Ticket number or summary"
          />
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-category-filter">Category</label>
          <select id="ticket-category-filter" value={filters.categoryId} onChange={(event) => updateFilters({ categoryId: event.target.value })}>
            <option value="">All categories</option>
            {referenceData.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-related-system-filter">Related System</label>
          <select id="ticket-related-system-filter" value={filters.relatedSystemId} onChange={(event) => updateFilters({ relatedSystemId: event.target.value })}>
            <option value="">All related systems</option>
            {referenceData.relatedSystems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
          </select>
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-priority-filter">Requested Priority</label>
          <select id="ticket-priority-filter" value={filters.requestedPriority} onChange={(event) => updateFilters({ requestedPriority: event.target.value as "" | RequestedPriority })}>
            <option value="">All priorities</option>
            {requestedPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-sort">Sort</label>
          <select id="ticket-sort" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as TicketFilters["sort"] })}>
            <option value="createdAt:desc">Newest first</option>
            <option value="updatedAt:desc">Recently updated</option>
            <option value="updatedAt:asc">Least recently updated</option>
            <option value="ticketNumber:asc">Ticket number (A–Z)</option>
            <option value="ticketNumber:desc">Ticket number (Z–A)</option>
            <option value="requestedPriority:asc">Priority (low to urgent)</option>
            <option value="requestedPriority:desc">Priority (urgent to low)</option>
          </select>
        </div>

        <div className="ticket-toolbar-actions">
          <button className="button button-secondary" type="button" onClick={clearFilters} disabled={!hasModifiedControls}>Clear filters</button>
          <button className="button button-secondary" type="button" onClick={() => setReloadVersion((version) => version + 1)} disabled={loading}>Refresh</button>
        </div>
      </div>

      {loading && <p className="status-message" role="status">Loading your Tickets...</p>}

      {!loading && error && (
        <div className="error-panel" role="alert">
          <p>{error}</p>
          <button className="button button-secondary" type="button" onClick={() => setReloadVersion((version) => version + 1)}>Retry</button>
        </div>
      )}

      {!loading && !error && results?.items.length === 0 && (
        <div className="empty-panel" role="status">
          <p>{hasSearchOrFilters ? "No Tickets match your search or filters." : "No Tickets have been created for this Requester yet."}</p>
          {hasSearchOrFilters ? <button className="button button-secondary" type="button" onClick={clearFilters}>Clear filters</button> : <button className="button button-primary" type="button" onClick={onCreateTicket}>Create Ticket</button>}
        </div>
      )}

      {!loading && !error && results && results.items.length > 0 && (
        <>
          <div className="ticket-table-wrapper">
            <table className="ticket-table">
              <thead>
                <tr><th>Ticket Number</th><th>Summary</th><th>Category</th><th>Requested Priority</th><th>Current Status</th><th>Last Updated</th></tr>
              </thead>
              <tbody>
                {results.items.map((ticket) => (
                  <tr key={ticket.id}>
                    <td data-label="Ticket Number"><strong>{ticket.ticketNumber}</strong></td>
                    <td data-label="Summary">{ticket.summary}</td>
                    <td data-label="Category">{ticket.category.name}</td>
                    <td data-label="Requested Priority"><span className={`priority-badge priority-${ticket.requestedPriority.toLowerCase()}`}>{ticket.requestedPriority}</span></td>
                    <td data-label="Current Status"><span className="status-badge">{ticket.currentStatus}</span></td>
                    <td data-label="Last Updated">{formatTicketDate(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="ticket-pagination" aria-label="Ticket pages">
            <button className="button button-secondary" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={results.page <= 1}>Previous</button>
            <p aria-live="polite">{pageSummary}</p>
            <button className="button button-secondary" type="button" onClick={() => setPage((current) => Math.min(results.totalPages, current + 1))} disabled={results.page >= results.totalPages}>Next</button>
          </nav>
        </>
      )}
    </section>
  );
}

function formatTicketDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
