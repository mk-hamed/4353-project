import { useSearchParams } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

export default function QueueManagement() {
  const { services, queues, lastServed, removeUser, moveUser, serveNext } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId =
    services.find((s) => String(s.id) === searchParams.get("service"))?.id ??
    services[0]?.id;
  const service = services.find((s) => s.id === selectedId);
  const queue = (service && queues[service.id]) || [];
  const served = service ? lastServed[service.id] : null;

  return (
    <>
      <h1>Queue Management</h1>

      <section className="card">
        <div className="qs-admin-field">
          <label htmlFor="queue-service">Service</label>
          <select
            id="queue-service"
            value={selectedId ?? ""}
            onChange={(e) => setSearchParams({ service: e.target.value })}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.queueLength} waiting)
              </option>
            ))}
          </select>
        </div>
      </section>

      {service && (
        <section className="card">
          <div className="qs-admin-card-head">
            <h2>
              {service.name} <span className={`badge ${service.status}`}>{service.status}</span>
            </h2>
            <button
              type="button"
              className="qs-admin-btn"
              onClick={() => serveNext(service.id)}
              disabled={queue.length === 0}
            >
              Serve next
            </button>
          </div>

          {served && (
            <p className="qs-admin-success" role="status">
              Now serving: {served.name}
            </p>
          )}

          {queue.length === 0 ? (
            <p>No one is waiting in this queue.</p>
          ) : (
            <div className="qs-admin-table-wrap">
              <table className="qs-admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Joined</th>
                    <th>Est. wait</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{u.name}</strong>
                        <div className="qs-admin-sub">{u.email}</div>
                      </td>
                      <td>{u.joinedAt}</td>
                      <td>{i * service.durationMin} min</td>
                      <td>
                        <div className="qs-admin-actions">
                          <button
                            type="button"
                            className="qs-admin-btn secondary"
                            onClick={() => moveUser(service.id, i, i - 1)}
                            disabled={i === 0}
                            aria-label={`Move ${u.name} up`}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="qs-admin-btn secondary"
                            onClick={() => moveUser(service.id, i, i + 1)}
                            disabled={i === queue.length - 1}
                            aria-label={`Move ${u.name} down`}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="qs-admin-btn danger"
                            onClick={() => removeUser(service.id, u.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
