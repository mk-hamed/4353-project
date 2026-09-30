import React, { useEffect } from "react";
import Icon from "../components/Icon.jsx";

// Only a handoff screen: the actual dashboards belong to other team members.
export default function DemoLanding({ user, onLogout }) {
  const roleLabel = user.role === "admin" ? "Admin" : "User";
  useEffect(() => {
    document.title = `QueueSmart | ${roleLabel} sign-in successful`;
  }, [roleLabel]);
  return (
    <section className="qs-handoff">
      <div className="qs-handoff-icon">
        <Icon name="check" size={28} />
      </div>
      <span className="qs-form-kicker">YOU'RE ALL SET</span>
      <h2>You're signed in.</h2>
      <p className="qs-handoff-description">Welcome to QueueSmart.</p>
      <dl className="qs-account-details">
        <div>
          <dt>Account</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Account type</dt>
          <dd>
            <span className="qs-role-badge">{roleLabel}</span>
          </dd>
        </div>
      </dl>
      <div className="qs-handoff-note">
        <strong>{roleLabel} dashboard connection</strong>
        <p>
          This confirms the authentication flow works. Your team's dashboard
          will connect here.
        </p>
      </div>
      <button type="button" className="qs-primary-button" onClick={onLogout}>
        Sign out <Icon name="exit" size={19} />
      </button>
      <p className="qs-field-hint qs-centered">
        Simulated session · refreshing signs you out.
      </p>
    </section>
  );
}
