import React, { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AuthLayout from "./components/AuthLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DemoLanding from "./pages/DemoLanding.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  function logout() {
    setUser(null);
    navigate("/login", { replace: true, state: null });
  }

  // This guard only controls the A2 demo UI. Real authorization needs a server.
  function protectedPage(role) {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== role)
      return (
        <Navigate
          to={user.role === "admin" ? "/admin" : "/dashboard"}
          replace
        />
      );
    return <DemoLanding user={user} onLogout={logout} />;
  }

  const destination = user?.role === "admin" ? "/admin" : "/dashboard";
  return (
    <AuthLayout>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={destination} replace />
            ) : (
              <Login onLogin={setUser} />
            )
          }
        />
        <Route
          path="/register"
          element={user ? <Navigate to={destination} replace /> : <Register />}
        />
        <Route path="/dashboard" element={protectedPage("user")} />
        <Route path="/admin" element={protectedPage("admin")} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthLayout>
  );
}
