import { useState } from "react";
import { fetchHealth } from "./api";

type SystemState = "idle" | "loading" | "online" | "offline";

export default function App() {
  const [systemState, setSystemState] = useState<SystemState>("idle");

  async function checkSystem() {
    setSystemState("loading");

    try {
      await fetchHealth();
      setSystemState("online");
    } catch {
      setSystemState("offline");
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-muted fs-5 ms-1">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={checkSystem} disabled={systemState === "loading"}>
        Check System
      </button>

      {systemState === "loading" && (
        <p className="mt-4" role="status">
          Loading system status...
        </p>
      )}

      {systemState === "online" && (
        <p className="mt-4 text-success" role="status">
          System Status: Online
        </p>
      )}

      {systemState === "offline" && (
        <div className="mt-4 text-danger" role="alert">
          <p className="mb-1">System Status: Offline</p>
          <p className="mb-0">Unable to connect to TokTickIT API</p>
        </div>
      )}
    </main>
  );
}
