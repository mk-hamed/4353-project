import { useEffect } from "react";
import EmptyState from "../../components/user/EmptyState";
import { useQueue } from "../../context/QueueContext";
import "../../queue-screens.css";

const statusLabels = {
  waiting: "Waiting...",
  "almost-ready": "Almost ready",
  served: "Served",
};

function statusMessage(queue) {
  if (queue.status === "almost-ready") {
    return queue.position === 1
      ? "You're next in line!"
      : "You're almost up. Please be ready.";
  }
  return "Please be patient. You'll be updated as you move up.";
}

export default function QueueStatus() {
  const { currentQueue, lastServed, loading, error, refreshQueue } = useQueue();

  // Fetch fresh data when the page opens; the provider also refreshes every few seconds.
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  if (loading) {
    return (
      <>
        <h1>Queue Status</h1>
        <p className="qs-queue-note">Loading your queue...</p>
      </>
    );
  }

  if (!currentQueue && lastServed) {
    return (
      <>
        <h1>Queue Status</h1>
        <section className="card">
          <h2>{lastServed.serviceName}</h2>
          <span className="badge served">{statusLabels.served}</span>
          <p>Thanks for using QueueSmart! See you next time!</p>
        </section>
      </>
    );
  }

  if (!currentQueue) {
    return (
      <>
        {error && <p className="qs-queue-error" role="alert">{error}</p>}
        <EmptyState
          title="You're not currently in a queue"
          message="Join a service to see your position here"
          actionText="Join a queue"
          actionTo="/join-queue"
        />
      </>
    );
  }

  return (
    <>
      <h1>Queue Status</h1>
      {error && <p className="qs-queue-error" role="alert">{error}</p>}
      <section className="card">
        <h2>{currentQueue.serviceName}</h2>
        <span className={`badge ${currentQueue.status}`}>
          {statusLabels[currentQueue.status]}
        </span>
        <p>{statusMessage(currentQueue)}</p>
        <p>
          <strong>Position: </strong> {currentQueue.position}
        </p>
        <p>
          <strong>Estimated wait:</strong> {currentQueue.estimatedWaitMin} min
        </p>
      </section>
    </>
  );
}
