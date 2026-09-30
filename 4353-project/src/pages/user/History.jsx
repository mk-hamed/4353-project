import { history } from "../../mock/data";
import EmptyState from "../../components/user/EmptyState";

// Turn "Left queue" into "left-queue" so it matches a CSS class
function outcomeClass(outcome) {
  return outcome.toLowerCase().replace(" ", "-");
}

export default function History() {
  if (history.length === 0) {
    return (
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
                <td>{h.date}</td>
                <td>{h.service}</td>
                <td>
                  <span className={`badge ${outcomeClass(h.outcome)}`}>
                    {h.outcome}
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
