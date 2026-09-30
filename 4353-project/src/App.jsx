import { Routes, Route, Navigate } from "react-router-dom";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/user/Dashboard";
import QueueStatus from "./pages/user/QueueStatus";

export default function App() {
  return (
    /* Auth routing */

    /* User routing */
    <Routes>
      <Route element={<UserLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue-status" element={<QueueStatus />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>

    /* Admin routing */
  );
}
