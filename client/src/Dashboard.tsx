import { useEffect, useState } from "react";
import {
  fetchRequesterDashboard, fetchStaffDashboard, TicketApiError,
  type RequesterDashboard, type StaffDashboard, type StaffQueueQuery, type TicketListQuery,
} from "./api";

type RequesterMetric = keyof RequesterDashboard["metrics"];
type StaffMetric = keyof StaffDashboard["metrics"];

const requesterCards: Array<{ key: RequesterMetric; title: string; drillDown: TicketListQuery }> = [
  { key: "openTickets", title: "Total Open", drillDown: { currentStatus: ["NEW", "OPEN", "IN_PROGRESS", "REOPENED"] } },
  { key: "waitingForRequester", title: "Waiting for You", drillDown: { currentStatus: "WAITING_FOR_REQUESTER" } },
  { key: "recentlyUpdated", title: "Recently Updated", drillDown: { updatedWithinDays: 30, sort: "recent" } },
  { key: "recentlyResolved", title: "Recently Resolved", drillDown: { currentStatus: ["RESOLVED", "CLOSED"], resolvedWithinDays: 30 } },
];

const operational = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"] as const;
const staffCards: Array<{ key: StaffMetric; title: string; drillDown: StaffQueueQuery }> = [
  { key: "unassignedTickets", title: "Unassigned", drillDown: { currentStatus: [...operational], owner: "unassigned" } },
  { key: "ownedByMe", title: "Owned by me", drillDown: { currentStatus: [...operational], owner: "me" } },
  { key: "urgentTickets", title: "Urgent", drillDown: { currentStatus: [...operational], itPriority: ["HIGH", "URGENT"] } },
  { key: "waitingForRequester", title: "Waiting for Requester", drillDown: { currentStatus: "WAITING_FOR_REQUESTER" } },
];

function useDashboard<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    void load().then(result => { if (active) setData(result); }).catch(caught => {
      if (active) setError(caught instanceof TicketApiError && caught.status === 403
        ? "You are not permitted to view this Dashboard."
        : "Unable to load the Dashboard. Please retry.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, version]);
  return { data, loading, error, retry: () => setVersion(value => value + 1) };
}

function DashboardState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <div className="dashboard-loading" role="status" aria-busy="true"><p>Loading Dashboard...</p><div className="dashboard-skeleton-grid" aria-hidden="true"><span /><span /><span /><span /></div></div>;
  if (error) return <div className="error-panel" role="alert"><p>{error}</p>{!error.startsWith("You are not permitted") && <button className="button button-secondary" type="button" onClick={retry}>Retry</button>}</div>;
  return null;
}

function MetricCard({ title, count, onClick }: { title: string; count: number; onClick: () => void }) {
  return <button className="dashboard-metric" type="button" onClick={onClick} aria-label={`View ${count} ${title.toLowerCase()} Tickets`}><span>{title}</span><strong>{count}</strong><small>View matching Tickets →</small></button>;
}

export function RequesterDashboardView({ onDrillDown, onViewTicket, onCreateTicket }: {
  onDrillDown: (query: TicketListQuery) => void; onViewTicket: (id: number) => void; onCreateTicket: () => void;
}) {
  const { data, loading, error, retry } = useDashboard(fetchRequesterDashboard);
  return <section className="ticket-card dashboard-card" aria-labelledby="requester-dashboard-heading">
    <div className="ticket-card-heading"><div><p className="section-kicker">Requester workspace</p><h1 id="requester-dashboard-heading">Dashboard</h1><p>Your Tickets at a glance. Counts are refreshed when this page opens.</p></div></div>
    <DashboardState loading={loading} error={error} retry={retry} />
    {data && <><div className="dashboard-metrics" aria-label="Your Ticket metrics">{requesterCards.map(card => <MetricCard key={card.key} title={card.title} count={data.metrics[card.key]} onClick={() => onDrillDown(card.drillDown)} />)}</div>
      <div className="dashboard-recent"><h2>Recent Tickets</h2>{data.recentTickets.length === 0
        ? <div className="empty-panel" role="status"><p>You have no Tickets yet.</p><button className="button button-primary" type="button" onClick={onCreateTicket}>Create Ticket</button></div>
        : <ul>{data.recentTickets.map(ticket => <li key={ticket.id}><div><strong>{ticket.ticketNumber}</strong><span>{ticket.summary}</span><small>{ticket.currentStatus.replaceAll("_", " ")}</small></div><button className="button button-secondary" type="button" onClick={() => onViewTicket(ticket.id)}>View details</button></li>)}</ul>}</div>
    </>}
  </section>;
}

export function StaffDashboardView({ onDrillDown, onViewTicket }: {
  onDrillDown: (query: StaffQueueQuery) => void; onViewTicket: (id: number) => void;
}) {
  const { data, loading, error, retry } = useDashboard(fetchStaffDashboard);
  return <section className="ticket-card dashboard-card" aria-labelledby="staff-dashboard-heading">
    <div className="ticket-card-heading"><div><p className="section-kicker">IT Staff workspace</p><h1 id="staff-dashboard-heading">Dashboard</h1><p>Operational work across the Ticket Queue.</p></div></div>
    <DashboardState loading={loading} error={error} retry={retry} />
    {data && <><div className="dashboard-metrics" aria-label="Operational Ticket metrics">{staffCards.map(card => <MetricCard key={card.key} title={card.title} count={data.metrics[card.key]} onClick={() => onDrillDown(card.drillDown)} />)}</div>
      <div className="dashboard-recent"><h2>Recent operational Tickets</h2>{data.recentTickets.length === 0
        ? <div className="empty-panel" role="status"><p>There is no operational work right now.</p></div>
        : <ul>{data.recentTickets.map(ticket => <li key={ticket.id}><div><strong>{ticket.ticketNumber}</strong><span>{ticket.summary}</span><small>{ticket.currentStatus.replaceAll("_", " ")} · {ticket.itPriority} · {ticket.owner?.displayName ?? "Unassigned"}</small></div><button className="button button-secondary" type="button" onClick={() => onViewTicket(ticket.id)}>Open</button></li>)}</ul>}</div>
    </>}
  </section>;
}
