import { Link } from "react-router-dom";
import { services, currentQueue, notifications } from "../../mock/data";

export default function Dashboard() {
  const unread = notifications.filter((n) => !n.read).length;
  const myService = currentQueue
    ? services.find((s) => s.id === currentQueue.serviceId)
    : null;

  return (
    <>
      <h1>Dashboard</h1>

      <section className="card">
        <h2>Your Queue</h2>
        {myService ? (
          <>
            <p>
              <strong>{myService.name}</strong> - position{" "}
              {currentQueue.position}
            </p>
            <p>
              Estimated wait: {currentQueue.position * myService.durationMin}{" "}
              min
            </p>
            <Link to="/queue-status">View Details</Link>
          </>
        ) : (
          <>
            <p>You're not in a join queue.</p>
            <Link to="join-queue">Join one</Link>
          </>
        )}
      </section>

      <h2>Available Services</h2>
      {services.map((s) => (
        <div className="card" key={s.id}>
          <strong>{s.name}</strong>{" "}
          <span className={"badge ${s.status}"}>{s.status}</span>
          <p>
            {s.description} | {s.queueLength} waiting
          </p>
        </div>
      ))}

      <section className="card">
        <h2>Notifications</h2>
        <p>You have {unread} unread notifications.</p>
      </section>
    </>
  );
}
