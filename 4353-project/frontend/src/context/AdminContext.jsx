import { createContext, useContext, useState } from "react";
import { services as seedServices } from "../mock/data";
import { seedQueues } from "../mock/adminData";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [services, setServices] = useState(seedServices);
  const [queues, setQueues] = useState(seedQueues);
  const [lastServed, setLastServed] = useState({}); // { [serviceId]: user }

  // queueLength is derived so it can never drift from the actual queue.
  const servicesWithLength = services.map((s) => ({
    ...s,
    queueLength: queues[s.id]?.length ?? 0,
  }));

  function toggleStatus(id) {
    setServices((list) =>
      list.map((s) =>
        s.id === id ? { ...s, status: s.status === "open" ? "closed" : "open" } : s
      )
    );
  }

  function addService(data) {
    const id = Math.max(0, ...services.map((s) => s.id)) + 1;
    setServices((list) => [...list, { id, status: "open", ...data }]);
    setQueues((q) => ({ ...q, [id]: [] }));
  }

  function updateService(id, data) {
    setServices((list) => list.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }

  function removeUser(serviceId, userId) {
    setQueues((q) => ({
      ...q,
      [serviceId]: q[serviceId].filter((u) => u.id !== userId),
    }));
  }

  function moveUser(serviceId, from, to) {
    setQueues((q) => {
      const list = [...q[serviceId]];
      if (to < 0 || to >= list.length) return q;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...q, [serviceId]: list };
    });
  }

  function serveNext(serviceId) {
    const next = queues[serviceId]?.[0];
    if (!next) return;
    setQueues((q) => ({ ...q, [serviceId]: q[serviceId].slice(1) }));
    setLastServed((m) => ({ ...m, [serviceId]: next }));
  }

  return (
    <AdminContext.Provider
      value={{
        services: servicesWithLength,
        queues,
        lastServed,
        toggleStatus,
        addService,
        updateService,
        removeUser,
        moveUser,
        serveNext,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
