import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import EmptyState from "../../components/user/EmptyState";

// Turn "Left queue" into "left-queue" so it matches a CSS class
function outcomeClass(outcome) {
  return (outcome || "unknown").toLowerCase().replace(/\s+/g, "-");
}
export default function History() {
    const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
    useEffect(() => {
    async function loadHistory() {
      try {
        const { user } = await apiRequest("/api/auth/me").then((user) => ({ user }));
        const data = await apiRequest(
          `/api/history/${encodeURIComponent(user.id)}`,
        );
        setHistory(Array.isArray(data) ? data : data?.history ?? []);
      } catch (err) {
        setError(err.message || "Unable to load history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);
if (loading) {
  return <p>Loading history...</p>;
}

if (error) {
  return <p>{error}</p>;
}

if (history.length === 0) {    return (
      <EmptyState
        title="No history yet"
        message="Queues you join will show up here."
        actionText="Join a queue"
        actionTo="/join-queue"
      />
    );
  }

  return (
    <>
      <h1>History</h1>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.date || (h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "—")}</td>
                <td>{h.service || h.record?.service || "Queue activity"}</td>
                <td>
                  <span className={`badge ${outcomeClass(h.outcome)}`}>
                    {h.outcome || h.record?.outcome || h.record || "Unknown"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
