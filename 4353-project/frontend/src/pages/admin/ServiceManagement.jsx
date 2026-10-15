import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const PRIORITIES = ["low", "medium", "high"];
const EMPTY = { name: "", description: "", durationMin: "", priority: "medium" };

function validate(values, services, editingId) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Service name is required.";
  else if (name.length > 100) errors.name = "Service name must be 100 characters or fewer.";
  else if (
    services.some((s) => s.id !== editingId && s.name.toLowerCase() === name.toLowerCase())
  )
    errors.name = "A service with this name already exists.";

  if (!values.description.trim()) errors.description = "Description is required.";
  else if (values.description.trim().length > 500)
    errors.description = "Description must be 500 characters or fewer.";

  const d = values.durationMin;
  if (d === "") errors.durationMin = "Expected duration is required.";
  else if (!Number.isInteger(Number(d))) errors.durationMin = "Duration must be a whole number of minutes.";
  else if (Number(d) < 1 || Number(d) > 480)
    errors.durationMin = "Duration must be between 1 and 480 minutes.";

  if (!PRIORITIES.includes(values.priority)) errors.priority = "Choose a priority level.";
  return errors;
}

export default function ServiceManagement() {
  const { services, addService, updateService } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  // ?edit=ID (from the dashboard) pre-loads that service into the form.
  const initialEdit = services.find((s) => String(s.id) === searchParams.get("edit"));
  const [editingId, setEditingId] = useState(initialEdit ? initialEdit.id : null);
  const [values, setValues] = useState(
    initialEdit
      ? {
          name: initialEdit.name,
          description: initialEdit.description,
          durationMin: String(initialEdit.durationMin),
          priority: initialEdit.priority,
        }
      : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function change(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setMessage("");
  }

  function startEdit(s) {
    setEditingId(s.id);
    setValues({
      name: s.name,
      description: s.description,
      durationMin: String(s.durationMin),
      priority: s.priority,
    });
    setErrors({});
    setMessage("");
  }

  function reset() {
    setEditingId(null);
    setValues(EMPTY);
    setErrors({});
    if (searchParams.get("edit")) setSearchParams({});
  }

  function submit(e) {
    e.preventDefault();
    const found = validate(values, services, editingId);
    setErrors(found);
    if (Object.keys(found).length) return;

    const data = {
      name: values.name.trim(),
      description: values.description.trim(),
      durationMin: Number(values.durationMin),
      priority: values.priority,
    };
    if (editingId) {
      updateService(editingId, data);
      setMessage(`Updated "${data.name}".`);
    } else {
      addService(data);
      setMessage(`Created "${data.name}".`);
    }
    reset();
  }

  return (
    <>
      <h1>Service Management</h1>

      <section className="card">
        <h2>{editingId ? "Edit service" : "Create a service"}</h2>
        {message && <p className="qs-admin-success" role="status">{message}</p>}

        <form onSubmit={submit} noValidate className="qs-admin-form">
          <div className="qs-admin-field">
            <label htmlFor="svc-name">Service name *</label>
            <input
              id="svc-name"
              name="name"
              type="text"
              value={values.name}
              onChange={change}
              maxLength={100}
              required
              aria-invalid={!!errors.name}
              aria-describedby="svc-name-msg"
            />
            <span id="svc-name-msg" className={errors.name ? "qs-admin-error" : "qs-admin-hint"}>
              {errors.name || `${values.name.length}/100 characters`}
            </span>
          </div>

          <div className="qs-admin-field">
            <label htmlFor="svc-desc">Description *</label>
            <textarea
              id="svc-desc"
              name="description"
              rows={3}
              value={values.description}
              onChange={change}
              required
              maxLength={500}
              aria-invalid={!!errors.description}
              aria-describedby="svc-desc-msg"
            />
            <span id="svc-desc-msg" className={errors.description ? "qs-admin-error" : "qs-admin-hint"}>
              {errors.description || `${values.description.length}/500 characters`}
            </span>
          </div>

          <div className="qs-admin-row">
            <div className="qs-admin-field">
              <label htmlFor="svc-duration">Expected duration (minutes) *</label>
              <input
                id="svc-duration"
                name="durationMin"
                type="number"
                min="1"
                max="480"
                step="1"
                value={values.durationMin}
                onChange={change}
                required
                aria-invalid={!!errors.durationMin}
                aria-describedby="svc-duration-msg"
              />
              <span id="svc-duration-msg" className={errors.durationMin ? "qs-admin-error" : "qs-admin-hint"}>
                {errors.durationMin || "Whole minutes, 1 to 480"}
              </span>
            </div>

            <div className="qs-admin-field">
              <label htmlFor="svc-priority">Priority level *</label>
              <select
                id="svc-priority"
                name="priority"
                value={values.priority}
                onChange={change}
                required
                aria-invalid={!!errors.priority}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              {errors.priority && <span className="qs-admin-error">{errors.priority}</span>}
            </div>
          </div>

          <div className="qs-admin-actions">
            <button type="submit" className="qs-admin-btn">
              {editingId ? "Save changes" : "Create service"}
            </button>
            {editingId && (
              <button type="button" className="qs-admin-btn secondary" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <h2>Existing services</h2>
      <div className="card qs-admin-table-wrap">
        <table className="qs-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Priority</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="qs-admin-sub">{s.description}</div>
                </td>
                <td>{s.durationMin} min</td>
                <td style={{ textTransform: "capitalize" }}>{s.priority}</td>
                <td>
                  <span className={`badge ${s.status}`}>{s.status}</span>
                </td>
                <td>
                  <button type="button" className="qs-admin-btn secondary" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
