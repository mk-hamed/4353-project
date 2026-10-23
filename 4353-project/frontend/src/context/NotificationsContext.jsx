import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { apiRequest } from "../api/client.js";
import { getCurrentUser } from "../auth/services/authService.js";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshNotifications = useCallback(async () => {
    try {
      const user = await getCurrentUser();

      if (!user?.id) {
        setItems([]);
        setError("Unable to identify the signed-in user.");
        return;
      }

      const data = await apiRequest(
        `/api/notifications/${encodeURIComponent(user.id)}`,
      );

      setItems(Array.isArray(data) ? data : data?.notifications ?? []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items],
  );

  const markAsRead = useCallback((id) => {
    setItems((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setItems((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        items,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}