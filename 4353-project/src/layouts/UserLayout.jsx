import { NavLink, Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/join-queue">Join Queue</NavLink>
        <NavLink to="/queue-status">My Queue</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
