import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

export default function AdminDashboard() {
  const { services, toggleStatus } = useAdmin();
  const openCount = services.filter((s) => s.status === "open").length;
  const totalWaiting = services.reduce((sum, s) => sum + s.queueLength, 0);

  return (
    <>
      <h1>Admin Dashboard</h1>

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
                      onClick={() => toggleStatus(s.id)}
                    >
                      {s.status === "open" ? "Close queue" : "Open queue"}
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
