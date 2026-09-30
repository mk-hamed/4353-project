import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

export function Brand() {
  return (
    <span className="qs-brand">
      <span className="qs-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        Queue<span className="qs-brand-light">Smart</span>
        <span className="qs-brand-dot">.</span>
      </span>
    </span>
  );
}

export default function AuthLayout({ children }) {
  const { pathname } = useLocation();
  const isRegistration = pathname === "/register";
  return (
    <div className="qs-app">
      <header className="qs-header">
        <Link
          to="/login"
          className="qs-brand-link"
          aria-label="QueueSmart sign in"
        >
          <Brand />
        </Link>
        <span className="qs-header-note">
          <span className="qs-status-dot" /> A little less waiting.
        </span>
      </header>
      <main id="main-content" className="qs-auth-layout">
        <aside className="qs-story" aria-label="About QueueSmart">
          <div className="qs-story-grid" aria-hidden="true" />
          <div className="qs-eyebrow">
            <span /> YOUR DAY, UNINTERRUPTED
          </div>
          <h1>
            Keep your spot.
            <br />
            <span>Get your time back.</span>
          </h1>
          <p className="qs-story-description">
            Join a queue, follow your progress, and spend
            <br className="qs-desktop-break" /> less of your day standing in
            line.
          </p>
          <div className="qs-ticket-wrap" aria-label="Example queue preview">
            <div className="qs-ticket">
              <div className="qs-ticket-header">
                <span className="qs-ticket-icon">
                  <Icon name="person" />
                </span>
                <div>
                  <p>Academic Advising</p>
                  <span>Student Services · Building A</span>
                </div>
                <span className="qs-live-badge">In queue</span>
              </div>
              <div className="qs-ticket-body">
                <div>
                  <span className="qs-small-label">YOUR POSITION</span>
                  <strong>
                    03<span>in line</span>
                  </strong>
                </div>
                <div className="qs-wait">
                  <span className="qs-small-label">ESTIMATED WAIT</span>
                  <p>
                    <Icon name="clock" size={19} /> 12 <span>min</span>
                  </p>
                </div>
              </div>
              <div className="qs-progress-track" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="qs-ticket-bottom">
                <span>You're on the list. We'll keep you posted.</span>
                <span>Q–024</span>
              </div>
            </div>
            <div className="qs-notification-preview">
              <span className="qs-notification-icon">
                <Icon name="bell" size={17} />
              </span>
              <div>
                <strong>One less thing to think about.</strong>
                <span>Your queue updates, all in one place.</span>
              </div>
              <span className="qs-notification-check">
                <Icon name="check" size={14} />
              </span>
            </div>
            <p className="qs-preview-caption">
              A glimpse of a smarter wait · illustrative preview
            </p>
          </div>
          <div className="qs-story-footer">
            <span>
              <Icon name="pin" size={16} /> Join from anywhere
            </span>
            <span>
              <Icon name="bell" size={16} /> Stay in the loop
            </span>
          </div>
        </aside>
        <section
          className="qs-form-panel"
          aria-label={isRegistration ? "Registration" : pathname === "/login" ? "Login" : "Sign-in confirmation"}
        >
          <div className="qs-form-container">
            {(pathname === "/login" || pathname === "/register") && (
              <nav className="qs-auth-tabs" aria-label="Authentication">
                <NavLink to="/login">Sign in</NavLink>
                <NavLink to="/register">Create account</NavLink>
              </nav>
            )}
            {children}
          </div>
          <p className="qs-panel-footer">Less waiting. More living.</p>
        </section>
      </main>
      <footer className="qs-footer">
        <span>QueueSmart · Smart Queue Management</span>
        <span className="qs-prototype-label">A2 front-end prototype</span>
      </footer>
    </div>
  );
}
