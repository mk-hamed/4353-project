import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import * as queueApi from "../../services/queueApi";

const POLL_MS = 5000;

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function QueueManagement() {
  const { services, servicesLoading, servicesError, refreshServices } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId =
    services.find((s) => String(s.id) === searchParams.get("service"))?.id ??
    services[0]?.id;

  const [view, setView] = useState(null); // { service, length, queue } from the API
  const [served, setServed] = useState(null); // { serviceId, email }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadQueue = useCallback(async (serviceId) => {
    try {
      setView(await queueApi.getQueue(serviceId));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (selectedId === undefined) return undefined;
    loadQueue(selectedId);
    // Refresh regularly so people who join or leave appear without a reload.
    const timer = setInterval(() => loadQueue(selectedId), POLL_MS);
    return () => clearInterval(timer);
  }, [selectedId, loadQueue]);

  async function handleServeNext() {
    setBusy(true);
    try {
      const result = await queueApi.serveNext(selectedId);
      setServed({ serviceId: selectedId, email: result.served.email });
      setError("");
    } catch (err) {
      setError(err.message);
    }
    await loadQueue(selectedId);
    refreshServices();
    setBusy(false);
  }

  // Ignore a response that belongs to a previously selected service.
  const current = view && view.service.id === selectedId ? view : null;
  const queue = current ? current.queue : [];
  const justServed = served && served.serviceId === selectedId ? served : null;

  return (
    <>
      <h1>Queue Management</h1>

      {(servicesError || error) && (
        <p className="qs-admin-error" role="alert">{servicesError || error}</p>
      )}
      {servicesLoading && services.length === 0 && <p>Loading services...</p>}

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

      {current && (
        <section className="card">
          <div className="qs-admin-card-head">
            <h2>
              {current.service.name}{" "}
              <span className={`badge ${current.service.status}`}>{current.service.status}</span>
            </h2>
            <button
              type="button"
              className="qs-admin-btn"
              onClick={handleServeNext}
              disabled={busy || queue.length === 0}
            >
              Serve next
            </button>
          </div>

          {justServed && (
            <p className="qs-admin-success" role="status">
              Now serving: {justServed.email}
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
                    <th>Priority</th>
                    <th>Joined</th>
                    <th>Est. wait</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((entry) => (
                    <tr key={entry.entryId}>
                      <td>{entry.position}</td>
                      <td><strong>{entry.email}</strong></td>
                      <td style={{ textTransform: "capitalize" }}>{entry.priority}</td>
                      <td>{formatTime(entry.joinedAt)}</td>
                      <td>{entry.estimatedWaitMin} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="qs-admin-hint">
            Served in order of priority, then arrival time.
          </p>
        </section>
      )}
    </>
  );
}
