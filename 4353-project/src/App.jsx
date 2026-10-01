import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/user/Dashboard";
import QueueStatus from "./pages/user/QueueStatus";
import History from "./pages/user/History";
import JoinQueue from "./pages/user/JoinQueue";
import Notifications from "./pages/user/Notifications";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ServiceManagement from "./pages/admin/ServiceManagement";
import QueueManagement from "./pages/admin/QueueManagement";
import AuthLayout from "./auth/components/AuthLayout.jsx";
import Login from "./auth/pages/Login.jsx";
import Register from "./auth/pages/Register.jsx";
import "./auth/styles/auth.css";
import "./user-screens.css";

function AuthenticationLayout() {
  return (
    <div className="qs-auth-surface">
      <AuthLayout><Outlet /></AuthLayout>
    </div>
  );
}

function AdminSession({ user, onLogout }) {
  useEffect(() => {
    document.title = "QueueSmart | Admin";
  }, []);

  return (
    <>
      <div className="qs-session-bar" aria-label="Signed-in account">
        <span>Signed in as {user.email} (admin)</span>
        <button type="button" onClick={onLogout}>Sign out</button>
      </div>
      <AdminLayout />
    </>
  );
}

function UserSession({ user, onLogout }) {
  useEffect(() => {
    document.title = "QueueSmart | Dashboard";
  }, []);

  return (
    <>
      <div className="qs-session-bar" aria-label="Signed-in account">
        <span>Signed in as {user.email}</span>
        <button type="button" onClick={onLogout}>Sign out</button>
      </div>
      <UserLayout />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const destination = user?.role === "admin" ? "/admin" : "/dashboard";

  function logout() {
    setUser(null);
    navigate("/login", { replace: true, state: null });
  }

  // These guards simulate A2 navigation; real authorization needs a backend.
  function requireRole(role, page) {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== role) return <Navigate to={destination} replace />;
    return page;
  }

  return (
    /* Auth routing */

    /* User routing */
    <Routes>
      <Route element={<AuthenticationLayout />}>
        <Route
          path="/login"
          element={user ? <Navigate to={destination} replace /> : <Login onLogin={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to={destination} replace /> : <Register />}
        />
      </Route>
      <Route element={requireRole("user", <UserSession user={user} onLogout={logout} />)}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue-status" element={<QueueStatus />} />
        <Route path="/history" element={<History />} />
        <Route path="/join-queue" element={<JoinQueue />} /> 
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route element={requireRole("admin", <AdminSession user={user} onLogout={logout} />)}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/queues" element={<QueueManagement />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? destination : "/login"} replace />} />
    </Routes>

    /* Admin routing */
  );
}
