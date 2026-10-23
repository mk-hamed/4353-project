import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as serviceApi from "../services/serviceApi.js";
import { seedQueues } from "../mock/adminData";

const AdminContext = createContext(null);

export function AdminProvider({ children, token }) {
  const [services, setServices] = useState([]);
  const [queues, setQueues] = useState(seedQueues);
  const [lastServed, setLastServed] = useState({}); // { [serviceId]: user }

  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const refreshServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError("");
    try {
      setServices(await serviceApi.listServices());
    } catch (error) {
      setServicesError(error.message);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    serviceApi.listServices().then(
      (data) => { if (active) setServices(data); },
      (error) => { if (active) setServicesError(error.message); },
    ).finally(() => { if (active) setServicesLoading(false); });
    // Quietly refresh so queue lengths change as users join, leave, or are served.
    const timer = setInterval(() => {
      serviceApi.listServices().then(
        (data) => { if (active) setServices(data); },
        () => {}, // keep showing the last good data if one refresh fails
      );
    }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  async function toggleStatus(id) {
    const service = services.find((item) => item.id === id);
    return updateService(id, { status: service.status === "open" ? "closed" : "open" });
  }

  async function addService(data) {
    const created = await serviceApi.createService(data, token);
    setServices((list) => [...list, created]);
    setQueues((q) => ({ ...q, [created.id]: [] }));
    return created;
  }

  async function updateService(id, data) {
    const updated = await serviceApi.updateService(id, data, token);
    setServices((list) => list.map((s) => (s.id === id ? updated : s)));
    return updated;
  }

  // Member 3 owns the remaining A2 mock queue actions below. Service fields and
  // queueLength above come from the API; do not overwrite them with seedQueues.
  function removeUser(serviceId, userId) {
    setQueues((q) => ({
      ...q,
      [serviceId]: (q[serviceId] || []).filter((u) => u.id !== userId),
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
        services,
        servicesLoading,
        servicesError,
        refreshServices,
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
