import { useEffect } from "react";
import NotificationsPanel from "../../components/user/Notifications";

export default function Notifications() {
  useEffect(() => {
    document.title = "QueueSmart | Notifications";
  }, []);

  return (
    <>
      <h1>Notifications</h1>
      <NotificationsPanel />
    </>
  );
}
