import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as queueApi from "../services/queueApi.js";

const QueueContext = createContext(null);

const POLL_MS = 5000;

// Mounted inside the signed-in user session (see App.jsx), so it starts empty for
// every login and is discarded on sign out.
export function QueueProvider({ children }) {
  // currentQueue: { serviceId, serviceName, position, status, estimatedWaitMin, queueLength } or null
  const [currentQueue, setCurrentQueue] = useState(null);
  // lastServed: { serviceId, serviceName, servedAt } after an admin served this user, else null
  const [lastServed, setLastServed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshQueue = useCallback(async () => {
    try {
      const data = await queueApi.getCurrentQueue();
      setCurrentQueue(data.currentQueue);
      setLastServed(data.lastServed);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    // Poll so position changes made by the admin show up without a reload.
    const timer = setInterval(refreshQueue, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshQueue]);

  // Both throw the backend's message on failure (closed queue, already joined, ...).
  async function joinQueue(serviceId) {
    await queueApi.joinQueue(serviceId);
    await refreshQueue();
  }

  async function leaveQueue() {
    if (!currentQueue) return;
    await queueApi.leaveQueue(currentQueue.serviceId);
    await refreshQueue();
  }

  return (
    <QueueContext.Provider
      value={{ currentQueue, lastServed, loading, error, refreshQueue, joinQueue, leaveQueue }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
