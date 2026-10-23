import { useCallback, useEffect, useState } from "react";
import { useQueue } from "../../context/QueueContext";
import { listServices } from "../../services/serviceApi";
import { getQueueSummaries } from "../../services/queueApi";
import "../../queue-screens.css";

export default function JoinQueue() {
  const { currentQueue, joinQueue, leaveQueue, refreshQueue } = useQueue();
  const joinedId = currentQueue ? currentQueue.serviceId : null;

  const [services, setServices] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Services come from Member 2's API; queue length and wait come from the queue API.
  const load = useCallback(async () => {
    try {
      // Refresh our own position in the same round trip so the numbers on a card agree.
      const [list, queueInfo] = await Promise.all([
        listServices(),
        getQueueSummaries(),
        refreshQueue(),
      ]);
      setServices(list);
      setSummaries(Object.fromEntries(queueInfo.map((item) => [item.serviceId, item])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    load();
    // Keep queue sizes and our position current while the page is open.
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function run(serviceId, action) {
    setBusyId(serviceId);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    }
    await load();
    setBusyId(null);
  }

  return (
    <>
      <h1>Join Queue</h1>
      {error && <p className="qs-queue-error" role="alert">{error}</p>}
      {loading && <p className="qs-queue-note">Loading services...</p>}

      {services.map((s) => {
        const info = summaries[s.id];
        const isJoined = joinedId === s.id;
        const isClosed = s.status === "closed";
        const inAnotherQueue = joinedId !== null && !isJoined;
        const busy = busyId === s.id;

        return (
          <div className="card" key={s.id}>
            <strong>{s.name}</strong>{" "}
            <span className={`badge ${s.status}`}>{s.status}</span>
            <p>{s.description}</p>
            {isJoined ? (
              <p>
                {info ? info.queueLength : s.queueLength} waiting | You are number{" "}
                {currentQueue.position} | Your estimated wait: {currentQueue.estimatedWaitMin} min
              </p>
            ) : (
              <p>
                {info ? info.queueLength : s.queueLength} waiting
                {info && <> | Estimated wait: {info.estimatedWaitMin} min</>}
              </p>
            )}
            {isJoined ? (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => run(s.id, leaveQueue)}
              >
                Leave Queue
              </button>
            ) : (
              <button
                disabled={isClosed || inAnotherQueue || busy}
                onClick={() => run(s.id, () => joinQueue(s.id))}
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
