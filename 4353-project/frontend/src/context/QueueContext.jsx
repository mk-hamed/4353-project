import { createContext, useContext, useState } from "react";
import { services, currentQueue as initialQueue } from "../mock/data";

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [currentQueue, setCurrentQueue] = useState(initialQueue);

  function joinQueue(serviceId) {
    const service = services.find((s) => s.id === serviceId);
    setCurrentQueue({
      serviceId,
      position: service.queueLength + 1,
      status: "waiting",
    });
  }

  function leaveQueue() {
    setCurrentQueue(null);
  }

  return (
    <QueueContext.Provider value={{ currentQueue, joinQueue, leaveQueue }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
