import { services } from "../../mock/data";
import EmptyState from "../../components/user/EmptyState";
import { useQueue } from "../../context/QueueContext";

const statusLabels = {
  waiting: "Waiting...",
  "almost-ready": "Almost ready",
  served: "Served",
};

const statusMessages = {
  waiting: "Please be patient. You'll be updated as you move up.",
  "almost-ready": "You're next in line!",
  served: "Thanks for using QueueSmart! See you next time!",
};

export default function QueueStatus() {
  const { currentQueue } = useQueue();

  if (!currentQueue) {
    return (
      <EmptyState
        title="You're not currently in a queue"
        message="Join a service to see your position here"
        actionText="Join a queue"
        actionTo="/join-queue"
      />
    );
  }

  const service = services.find((s) => s.id === currentQueue.serviceId);
  const wait = currentQueue.position * service.durationMin;

  return (
    <>
      <h1>Queue Status</h1>
      <section className="card">
        <h2>{service.name}</h2>
        <span className={`badge ${currentQueue.status}`}>
          {statusLabels[currentQueue.status]}
        </span>
        <p>{statusMessages[currentQueue.status]}</p>
        <p>
          <strong>Position: </strong> {currentQueue.position}
        </p>
        <p>
          <strong>Estimated wait:</strong> {wait} min
        </p>
      </section>
    </>
  );
}
