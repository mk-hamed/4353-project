import { NavLink, Outlet } from "react-router-dom";
import { AdminProvider } from "../context/AdminContext";
import "../admin-screens.css";

// Reuses the "qs-user-surface" class so the shared tokens, nav, .card and .badge styles apply.
export default function AdminLayout() {
  return (
    <AdminProvider>
      <div className="qs-user-surface">
        <nav>
          <NavLink to="/admin" end>Admin Dashboard</NavLink>
          <NavLink to="/admin/services">Services</NavLink>
          <NavLink to="/admin/queues">Queues</NavLink>
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </AdminProvider>
  );
}
