import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCategories, fetchRelatedSystems, fetchStaffQueue, requestedPriorities, type Category, type RelatedSystem, type RequestedPriority, type StaffQueueResponse, type Ticket } from "./api";

type QueueFilters = { search: string; categoryId: string; relatedSystemId: string; requestedPriority: "" | RequestedPriority; currentStatus: "" | Ticket["currentStatus"]; sort: "updatedAt:desc" | "updatedAt:asc" | "createdAt:desc" | "ticketNumber:asc" | "itPriority:desc" | "currentStatus:asc" };
const statuses: Ticket["currentStatus"][] = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"];
const initialFilters: QueueFilters = { search: "", categoryId: "", relatedSystemId: "", requestedPriority: "", currentStatus: "", sort: "updatedAt:desc" };

export default function StaffTicketQueue({ onViewTicket }: { onViewTicket: (id: number) => void }) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [referenceData, setReferenceData] = useState<{ categories: Category[]; relatedSystems: RelatedSystem[] }>({ categories: [], relatedSystems: [] });
  const [results, setResults] = useState<StaffQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [sortBy, sortOrder] = filters.sort.split(":") as ["updatedAt" | "createdAt" | "ticketNumber" | "itPriority" | "currentStatus", "asc" | "desc"];
  const filtered = Boolean(searchInput.trim() || filters.categoryId || filters.relatedSystemId || filters.requestedPriority || filters.currentStatus);

  useEffect(() => { let active = true; void Promise.all([fetchCategories(), fetchRelatedSystems()]).then(([categories, relatedSystems]) => { if (active) setReferenceData({ categories, relatedSystems }); }).catch(() => { if (active) setReferenceData({ categories: [], relatedSystems: [] }); }); return () => { active = false; }; }, []);
  useEffect(() => { const timer = window.setTimeout(() => { setFilters(current => current.search === searchInput ? current : { ...current, search: searchInput }); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [searchInput]);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    void fetchStaffQueue({ search: filters.search, categoryId: filters.categoryId ? Number(filters.categoryId) : undefined, relatedSystemId: filters.relatedSystemId ? Number(filters.relatedSystemId) : undefined, requestedPriority: filters.requestedPriority || undefined, currentStatus: filters.currentStatus || undefined, sortBy, sortOrder, page, pageSize: 10 })
      .then(response => { if (active) setResults(response); })
      .catch(() => { if (active) setError("Unable to load the Ticket queue. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page, reloadVersion, sortBy, sortOrder]);

  const summary = useMemo(() => !results ? "" : `Showing ${results.totalItems ? (results.page - 1) * results.pageSize + 1 : 0}–${Math.min(results.page * results.pageSize, results.totalItems)} of ${results.totalItems} tickets · Page ${results.page} of ${results.totalPages}`, [results]);
  const update = (values: Partial<QueueFilters>) => { setFilters(current => ({ ...current, ...values })); setPage(1); };
  const clear = () => { setSearchInput(""); setFilters(initialFilters); setPage(1); };

  return <section className="ticket-card ticket-list-card" aria-labelledby="staff-queue-heading">
    <div className="ticket-card-heading"><div><p className="section-kicker">IT Staff workspace</p><h1 id="staff-queue-heading">Ticket Queue</h1><p>Review, assign and progress service requests.</p></div></div>
    <div className="ticket-toolbar" aria-label="Ticket queue search and filters">
      <div className="ticket-filter search-filter"><label htmlFor="queue-search">Search tickets</label><input id="queue-search" type="search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Ticket number or summary" /></div>
      <QueueSelect id="queue-category" label="Category" value={filters.categoryId} onChange={value => update({ categoryId: value })}><option value="">All categories</option>{referenceData.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</QueueSelect>
      <QueueSelect id="queue-system" label="Related System" value={filters.relatedSystemId} onChange={value => update({ relatedSystemId: value })}><option value="">All related systems</option>{referenceData.relatedSystems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</QueueSelect>
      <QueueSelect id="queue-priority" label="Requested Priority" value={filters.requestedPriority} onChange={value => update({ requestedPriority: value as QueueFilters["requestedPriority"] })}><option value="">All priorities</option>{requestedPriorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}</QueueSelect>
      <QueueSelect id="queue-status" label="Status" value={filters.currentStatus} onChange={value => update({ currentStatus: value as QueueFilters["currentStatus"] })}><option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</QueueSelect>
      <QueueSelect id="queue-sort" label="Sort" value={filters.sort} onChange={value => update({ sort: value as QueueFilters["sort"] })}><option value="updatedAt:desc">Recently updated</option><option value="updatedAt:asc">Least recently updated</option><option value="createdAt:desc">Newest first</option><option value="ticketNumber:asc">Ticket number (A–Z)</option><option value="itPriority:desc">IT priority (urgent first)</option><option value="currentStatus:asc">Status</option></QueueSelect>
      <div className="ticket-toolbar-actions"><button className="button button-secondary" type="button" onClick={clear} disabled={!filtered && filters.sort === initialFilters.sort}>Clear filters</button><button className="button button-secondary" type="button" onClick={() => setReloadVersion(value => value + 1)} disabled={loading}>Refresh</button></div>
    </div>
    {loading && <p className="status-message" role="status">Loading the Ticket queue...</p>}
    {!loading && error && <div className="error-panel" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => setReloadVersion(value => value + 1)}>Retry</button></div>}
    {!loading && !error && results?.items.length === 0 && <div className="empty-panel" role="status"><p>{filtered ? "No Tickets match your search or filters." : "There are no Tickets in the queue yet."}</p>{filtered && <button className="button button-secondary" type="button" onClick={clear}>Clear filters</button>}</div>}
    {!loading && !error && results && results.items.length > 0 && <><div className="ticket-table-wrapper"><table className="ticket-table"><thead><tr><th>Ticket</th><th>Summary</th><th>Requester</th><th>Category</th><th>Requested / IT Priority</th><th>Status</th><th>Owner</th><th>Last Updated</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{results.items.map(ticket => <tr key={ticket.id}><td data-label="Ticket"><strong>{ticket.ticketNumber}</strong></td><td data-label="Summary">{ticket.summary}</td><td data-label="Requester">{ticket.requester.displayName}</td><td data-label="Category">{ticket.category.name}</td><td data-label="Priority"><span className={`priority-badge priority-${ticket.requestedPriority.toLowerCase()}`}>{ticket.requestedPriority}</span> / <span className={`priority-badge priority-${ticket.itPriority.toLowerCase()}`}>{ticket.itPriority}</span></td><td data-label="Status"><span className="status-badge">{ticket.currentStatus.replaceAll("_", " ")}</span></td><td data-label="Owner">{ticket.owner?.displayName ?? "Unassigned"}</td><td data-label="Last Updated">{formatDate(ticket.updatedAt)}</td><td data-label="Action"><button className="button button-secondary" type="button" onClick={() => onViewTicket(ticket.id)}>Open</button></td></tr>)}</tbody></table></div><nav className="ticket-pagination" aria-label="Ticket queue pages"><button className="button button-secondary" type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={results.page <= 1}>Previous</button><p aria-live="polite">{summary}</p><button className="button button-secondary" type="button" onClick={() => setPage(value => Math.min(results.totalPages, value + 1))} disabled={results.page >= results.totalPages}>Next</button></nav></>}
  </section>;
}

function QueueSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode }) { return <div className="ticket-filter"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></div>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date); }
