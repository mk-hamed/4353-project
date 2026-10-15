import { createContext, useContext, useState, useMemo } from "react";
import { notifications as initialNotifications } from "../mock/data";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState(initialNotifications);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  function markAsRead(id) {
    setItems((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllAsRead() {
    setItems((current) => current.map((n) => ({ ...n, read: true })));
  }

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
