import { useQueue } from "../../context/QueueContext";
import { services } from "../../mock/data";

export default function JoinQueue() {
  const { currentQueue, joinQueue, leaveQueue } = useQueue();
  const joinedId = currentQueue ? currentQueue.serviceId : null;

  return (
    <>
      <h1>Join Queue</h1>
      {services.map((s) => {
        const isJoined = joinedId === s.id;
        const isClosed = s.status === "closed";
        const inAnotherQueue = joinedId !== null && !isJoined;
        const estimatedWait = (s.queueLength + 1) * s.durationMin;

        return (
          <div className="card" key={s.id}>
            <strong>{s.name}</strong>{" "}
            <span className={`badge ${s.status}`}>{s.status}</span>
            <p>{s.description}</p>
            <p>
              {s.queueLength} waiting | Estimated wait: {estimatedWait} min
            </p>
            {isJoined ? (
              <button className="secondary" onClick={leaveQueue}>
                Leave Queue
              </button>
            ) : (
              <button
                disabled={isClosed || inAnotherQueue}
                onClick={() => joinQueue(s.id)}
              >
                Join Queue
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
