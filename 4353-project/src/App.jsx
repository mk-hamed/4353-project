import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/user/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* more pages go here as we build them */}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
