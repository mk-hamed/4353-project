import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/user/Dashboard";

export default function App() {
  return (
    /* Auth routing */

    /* User routing */
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>

    /* Admin routing */
  );
}
