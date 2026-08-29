import { useEffect, useState } from "react";
import { fetchRequesters, type Requester } from "./api";
import CreateTicketForm from "./CreateTicketForm";

const REQUESTER_STORAGE_KEY = "toktickit.lab2.developmentRequesterId";

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
    <main className="app-page">
      <section className="selector-card" aria-labelledby="requester-selection-heading">
        <p className="brand-eyebrow">TokTickIT</p>
        <h1 id="requester-selection-heading">Development Requester Selection</h1>
        <p className="selector-intro">Select a Development Requester to test requester-specific ticket behavior. This is not a login screen.</p>

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
            <label htmlFor="development-requester">Development Requester</label>
            <select
              id="development-requester"
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
          </>
        )}

        <button
          className="button button-primary"
          onClick={continueWithRequester}
          disabled={loading || Boolean(error) || !selectedRequesterId}
        >
          Continue
        </button>
      </section>
    </main>
  );
}

type RequesterWorkspaceProps = {
  requester: Requester;
  onChangeRequester: () => void;
};

function RequesterWorkspace({ requester, onChangeRequester }: RequesterWorkspaceProps) {
  const [view, setView] = useState<"home" | "create" | "tickets">("home");

  return (
    <main className="app-page">
      <header className="application-header">
        <div>
          <p className="brand-eyebrow">TokTickIT</p>
          <p className="application-title">IT Service Desk</p>
        </div>
        <div className="requester-context">
          <span>Development Requester</span>
          <strong>{requester.displayName}</strong>
          <button className="button button-secondary" onClick={onChangeRequester}>Change Requester</button>
        </div>
      </header>

      <nav className="workspace-navigation application-navigation" aria-label="Requester workspace">
        <button className={`button ${view === "create" ? "button-primary" : "button-secondary"}`} onClick={() => setView("create")}>Create Ticket</button>
        <button className={`button ${view === "tickets" ? "button-primary" : "button-secondary"}`} onClick={() => setView("tickets")}>My Tickets</button>
      </nav>

      {view === "home" && (
        <section className="workspace-card" aria-labelledby="workspace-heading">
          <h1 id="workspace-heading">Requester Workspace</h1>
          <p>You are testing the requester context for <strong>{requester.displayName}</strong>. Create a new request or view your requester-owned Tickets.</p>
          <button className="button button-primary" onClick={() => setView("create")}>Create Ticket</button>
        </section>
      )}

      {view === "create" && <CreateTicketForm requester={requester} onViewMyTickets={() => setView("tickets")} />}

      {view === "tickets" && (
        <section className="workspace-card" aria-labelledby="my-tickets-heading">
          <h1 id="my-tickets-heading">My Tickets</h1>
          <p>Ticket browsing will be available in the next approved Lab 2 Issue. You can create a new Ticket now.</p>
          <button className="button button-primary" onClick={() => setView("create")}>Create Ticket</button>
        </section>
      )}
    </main>
  );
}
