import { useEffect, useState } from "react";
import { fetchRequesters, type Requester } from "./api";
import CreateTicketForm from "./CreateTicketForm";
import MyTickets from "./MyTickets";
import TicketDetail from "./TicketDetail";

const REQUESTER_STORAGE_KEY = "toktickit.lab2.developmentRequesterId";

function BrandClockIcon() {
  return <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M15 7.5A19 19 0 1 1 7.2 17" /><path d="M7 7v10h10" /><path d="M24 13v12h9" /></svg>;
}

function TicketsIcon() {
  return <svg className="header-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
}

function AddTicketIcon() {
  return <svg className="header-nav-icon header-add-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
}

function ProfileIcon() {
  return <svg className="profile-avatar" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" /><circle cx="14" cy="10" r="4" /><path d="M6.5 23c.7-4 3.5-6.2 7.5-6.2s6.8 2.2 7.5 6.2" /></svg>;
}

function ChevronDownIcon() {
  return <svg className="profile-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>;
}

function HomeIcon() {
  return <svg className="breadcrumb-home" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5M10 20v-6h4v6" /></svg>;
}

function ShieldIcon() {
  return <span className="auth-shield" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 19 6v5.2c0 4.5-2.7 8.1-7 9.8-4.3-1.7-7-5.3-7-9.8V6l7-3Z" /></svg></span>;
}

export default function App() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedRequesterId, setSelectedRequesterId] = useState("");
  const [activeRequester, setActiveRequester] = useState<Requester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequesters(restoreStoredRequester = true) {
    setLoading(true);
    setError("");

    try {
      const loadedRequesters = await fetchRequesters();
      setRequesters(loadedRequesters);

      if (restoreStoredRequester) {
        const storedRequesterId = window.localStorage.getItem(REQUESTER_STORAGE_KEY);
        const storedRequester = loadedRequesters.find((requester) => requester.id === Number(storedRequesterId));
        if (storedRequester) {
          setActiveRequester(storedRequester);
        } else {
          window.localStorage.removeItem(REQUESTER_STORAGE_KEY);
        }
      }
    } catch {
      setError("Unable to load Development Requesters. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequesters();
  }, []);

  function continueWithRequester() {
    const requester = requesters.find((item) => item.id === Number(selectedRequesterId));
    if (!requester) return;

    window.localStorage.setItem(REQUESTER_STORAGE_KEY, String(requester.id));
    setActiveRequester(requester);
  }

  function changeRequester() {
    window.localStorage.removeItem(REQUESTER_STORAGE_KEY);
    setSelectedRequesterId("");
    setActiveRequester(null);
    void loadRequesters(false);
  }

  if (activeRequester) {
    return <RequesterWorkspace requester={activeRequester} onChangeRequester={changeRequester} />;
  }

  return (
    <main className="app-page application-page selector-page">
      <header className="application-header">
        <div className="application-brand"><BrandClockIcon /><div><p className="application-product">TokTickIT</p><p className="application-title">IT Service Desk</p></div></div>
        <nav className="application-navigation selector-navigation" aria-label="Requester workspace preview">
          <span className="header-nav-button header-nav-static"><TicketsIcon />My Tickets</span>
          <span className="header-nav-button header-nav-static"><AddTicketIcon />Create Ticket</span>
        </nav>
        <div className="requester-context" aria-label="Profile unavailable until a Requester is selected"><span className="header-change-requester header-profile-static"><ProfileIcon /><span>Profile</span><ChevronDownIcon /></span></div>
      </header>
      <div className="selector-breadcrumb" aria-label="Current page"><HomeIcon /><span aria-hidden="true">›</span><strong>Development Requester Selection</strong></div>
      <section className="selector-card" aria-labelledby="requester-selection-heading">
        <div className="selector-card-header">
          <span className="selector-user-icon" aria-hidden="true" />
          <h1 id="requester-selection-heading" aria-label="Development Requester Selection">Select Development Requester</h1>
          <p className="selector-intro">Choose a development requester to simulate the current requester context for Lab 2.</p>
          <p className="selector-testing-note">This is not a login screen. It is provided for testing only.</p>
        </div>
        <div className="selector-card-body">

        {loading && <p role="status" className="status-message">Loading Development Requesters...</p>}

          {error && (
          <div className="error-panel" role="alert">
            <p>{error}</p>
            <button className="button button-secondary" onClick={() => void loadRequesters()}>Retry</button>
          </div>
          )}

          {!loading && !error && requesters.length === 0 && (
          <div className="empty-panel" role="status">No active Development Requesters are available.</div>
          )}

          {!loading && !error && requesters.length > 0 && (
          <>
            <label htmlFor="development-requester">Development Requester <span className="required-marker" aria-hidden="true">*</span></label>
            <select
              id="development-requester"
              aria-label="Development Requester"
              value={selectedRequesterId}
              onChange={(event) => setSelectedRequesterId(event.target.value)}
            >
              <option value="">Choose a requester</option>
              {requesters.map((requester) => (
                <option key={requester.id} value={requester.id}>
                  {requester.displayName} ({requester.email})
                </option>
              ))}
            </select>
            <div className="selector-info-callout"><span className="callout-icon" aria-hidden="true">i</span>Only active development requesters are shown.</div>
          </>
        )}
          <div className="selector-auth-callout"><ShieldIcon /><div><strong>Authentication coming in Lab 3</strong><p>In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.</p></div></div>
        </div>
        <div className="selector-card-actions">
          <button className="button button-secondary selector-cancel" type="button" onClick={() => setSelectedRequesterId("")} disabled={!selectedRequesterId}>Cancel</button>
        <button
          className="button button-primary"
          onClick={continueWithRequester}
          disabled={loading || Boolean(error) || !selectedRequesterId}
        >
          <span aria-hidden="true">→</span> Continue
        </button>
        </div>
      </section>
    </main>
  );
}

type RequesterWorkspaceProps = {
  requester: Requester;
  onChangeRequester: () => void;
};

function RequesterWorkspace({ requester, onChangeRequester }: RequesterWorkspaceProps) {
  const [view, setView] = useState<"home" | "create" | "tickets" | "detail">("tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  function showTicketDetail(ticketId: number) {
    setSelectedTicketId(ticketId);
    setView("detail");
  }

  return (
    <main className="app-page application-page">
      <header className="application-header">
        <div className="application-brand"><BrandClockIcon /><div><p className="application-product">TokTickIT</p><p className="application-title">IT Service Desk</p></div></div>
        <nav className="application-navigation" aria-label="Requester workspace">
          <button className={`button header-nav-button ${view === "tickets" || view === "detail" ? "header-nav-button-active" : ""}`} onClick={() => setView("tickets")}><TicketsIcon />My Tickets</button>
          <button className={`button header-nav-button ${view === "create" ? "header-nav-button-active" : ""}`} onClick={() => setView("create")}><AddTicketIcon />Create Ticket</button>
        </nav>
        <div className="requester-context">
          <button aria-label="Change Requester" className="button header-change-requester" onClick={onChangeRequester} title={`Development Requester: ${requester.displayName}. Change requester.`}><ProfileIcon /><span>Profile</span><ChevronDownIcon /></button>
        </div>
      </header>

      {view === "home" && (
        <section className="workspace-card" aria-labelledby="workspace-heading">
          <h1 id="workspace-heading">Requester Workspace</h1>
          <p>You are testing the requester context for <strong>{requester.displayName}</strong>. Create a new request or view your requester-owned Tickets.</p>
          <button className="button button-primary" onClick={() => setView("create")}>Create Ticket</button>
        </section>
      )}

      {view === "create" && <CreateTicketForm requester={requester} onViewMyTickets={() => setView("tickets")} />}

      {view === "tickets" && <MyTickets key={requester.id} requester={requester} onCreateTicket={() => setView("create")} onViewTicket={showTicketDetail} />}

      {view === "detail" && selectedTicketId !== null && <TicketDetail requester={requester} ticketId={selectedTicketId} onBack={() => setView("tickets")} />}
    </main>
  );
}
