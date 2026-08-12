export default function App() {
  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-muted fs-5 ms-1">IT Service Desk</span>
      </h1>
      <div className="mb-4">
        <button className="btn btn-success" disabled>
          Check System
        </button>
      </div>
    </div>
  );
}
