import { useMemo, useState } from "react";
import { notifications as initialNotifications } from "../../mock/data";
//import "../../styles/notifications.css";

export default function Notifications({ compact = false }) {
  const [items, setItems] = useState(initialNotifications);


  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items],
  );


  function markAsRead(id) {
    setItems((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  function markAllAsRead() {
    setItems((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  const visibleItems = compact ? items.slice(0, 3) : items;


  return (
    <section className={`notifications-panel${compact ? " notifications-panel--compact" : ""}`} aria-labelledby="notifications-heading">
      <div className="notifications-header">
        <div>
          <span className="notifications-kicker">IN-APP UPDATES</span>
          <h2 id="notifications-heading">Notifications</h2>
          <p>Queue updates and status changes appear here.</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="notifications-mark-all" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="notification-empty">You're all caught up.</div>
      ) : (
        <ul className="notification-list">
          {visibleItems.map((notification) => (
            <li key={notification.id} className={`notification-item${notification.read ? " notification-item--read" : ""}`}>
              <span className="notification-dot" aria-hidden="true" />
              <div className="notification-content">
                <p>{notification.message}</p>
                {!notification.read && (
                  <button type="button" onClick={() => markAsRead(notification.id)}>
                    Mark as read
                  </button>
                )}
              </div>
              {!notification.read && <span className="notification-badge">NEW</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
