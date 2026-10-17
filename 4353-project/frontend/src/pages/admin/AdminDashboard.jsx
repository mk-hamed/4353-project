import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

export default function AdminDashboard() {
  const { services, toggleStatus, servicesLoading, servicesError, refreshServices } = useAdmin();
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function changeStatus(id) {
    if (pendingId !== null) return;
    setPendingId(id);
    setActionError("");
    try { await toggleStatus(id); }
    catch (error) { setActionError(error.message); }
    finally { setPendingId(null); }
  }

  if (servicesLoading) return <p role="status">Loading services...</p>;
  if (servicesError) return (
    <section className="card">
      <p role="alert" className="qs-admin-error">{servicesError}</p>
      <button type="button" className="qs-admin-btn" onClick={refreshServices}>Retry</button>
    </section>
  );
  const openCount = services.filter((s) => s.status === "open").length;
  const totalWaiting = services.reduce((sum, s) => sum + s.queueLength, 0);

  return (
    <>
      <h1>Admin Dashboard</h1>
      {actionError && <p role="alert" className="qs-admin-error">{actionError}</p>}

      <div className="qs-admin-stats">
        <section className="card">
          <h2>Services</h2>
          <p className="qs-admin-stat">{services.length}</p>
        </section>
        <section className="card">
          <h2>Open queues</h2>
          <p className="qs-admin-stat">{openCount}</p>
        </section>
        <section className="card">
          <h2>People waiting</h2>
          <p className="qs-admin-stat">{totalWaiting}</p>
        </section>
      </div>

      <h2>Services</h2>
      {!services.length && <p>No services yet. <Link to="/admin/services">Create a service</Link></p>}
      <div className="card qs-admin-table-wrap">
        <table className="qs-admin-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Status</th>
              <th>Queue length</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="qs-admin-sub">{s.description}</div>
                </td>
                <td>
                  <span className={`badge ${s.status}`}>{s.status}</span>
                </td>
                <td>{s.queueLength}</td>
                <td>
                  <div className="qs-admin-actions">
                    <button
                      type="button"
                      className={s.status === "open" ? "qs-admin-btn danger" : "qs-admin-btn"}
                      disabled={pendingId !== null}
                      onClick={() => changeStatus(s.id)}
                    >
                      {pendingId === s.id ? "Saving..." : s.status === "open" ? "Close queue" : "Open queue"}
                    </button>
                    <Link className="qs-admin-btn secondary" to={`/admin/queues?service=${s.id}`}>
                      Manage queue
                    </Link>
                    <Link className="qs-admin-btn secondary" to={`/admin/services?edit=${s.id}`}>
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
