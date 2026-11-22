export default function Status({ loading, error, empty, children }) {
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error.message}</p>;
  if (empty) return <p className="muted">{empty}</p>;
  return children;
}
