import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/user/Dashboard";
import AuthLayout from "./auth/components/AuthLayout.jsx";
import Login from "./auth/pages/Login.jsx";
import Register from "./auth/pages/Register.jsx";
import DemoLanding from "./auth/pages/DemoLanding.jsx";
import "./auth/styles/auth.css";

function AuthenticationLayout() {
  return (
    <div className="qs-auth-surface">
      <AuthLayout><Outlet /></AuthLayout>
    </div>
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
        <Route
          path="/admin"
          element={requireRole("admin", <DemoLanding user={user} onLogout={logout} />)}
        />
      </Route>
      <Route element={requireRole("user", <UserSession user={user} onLogout={logout} />)}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* more pages go here as we build them */}
      </Route>
      <Route path="*" element={<Navigate to={user ? destination : "/login"} replace />} />
    </Routes>
  );
}
