import { useState } from "react";
import { fetchCategories, fetchHealth, type Category } from "./api";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  async function checkSystem() {
    setLoading(true);
    setError("");

    try {
      await fetchHealth();
      const loadedCategories = await fetchCategories();
      setOnline(true);
      setCategories(loadedCategories);
    } catch (caughtError) {
      setOnline(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect to TokTickIT API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-muted fs-5 ms-1">IT Service Desk</span>
      </h1>
      <button className="btn btn-success" onClick={checkSystem} disabled={loading}>
        Check System
      </button>
      {loading && <p className="mt-4" role="status">Loading system status...</p>}
      {online && (
        <>
          <p className="mt-4 text-success" role="status">System Status: Online</p>
          <h2 className="h5">Supported Request Categories</h2>
          <ol>{categories.map((category) => <li key={category.id}>{category.name}</li>)}</ol>
        </>
      )}
      {online === false && (
        <div className="mt-4 text-danger" role="alert">
          <p>System Status: Offline</p>
          <p>{error}</p>
        </div>
      )}
    </main>
  );
}
