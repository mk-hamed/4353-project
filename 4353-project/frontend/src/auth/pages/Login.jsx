import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import Icon from "../components/Icon.jsx";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  login,
} from "../services/authService.js";
import { validateLogin } from "../utils/validation.js";

export default function Login({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoMessage, setDemoMessage] = useState("");
  const formRef = useRef(null);
  const serverErrorRef = useRef(null);

  useEffect(() => {
    document.title = "QueueSmart | Sign in";
  }, []);
  useEffect(() => {
    if (serverError) serverErrorRef.current?.focus();
  }, [serverError]);

  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
    setDemoMessage("");
  }

  function fillDemo(role) {
    const account = DEMO_ACCOUNTS[role];
    setValues({ email: account.email, password: account.password });
    setErrors({});
    setServerError("");
    setDemoMessage(
      `${role === "admin" ? "Admin" : "User"} demo filled. Select Sign in to continue.`,
    );
    formRef.current?.querySelector('[type="submit"]')?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setServerError("");
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      formRef.current.elements.namedItem(firstInvalid)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(values);
      onLogin(user);
      navigate(user.role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="qs-form-heading">
        <span className="qs-form-kicker">GOOD TO SEE YOU AGAIN</span>
        <h2>Welcome back.</h2>
        <p>Your spot in line is just a sign-in away.</p>
      </div>
      {location.state?.registered && (
        <div className="qs-success-banner" role="status">
          <Icon name="check" />
          <span>Account created! Sign in with your new password.</span>
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Sign in form"
        aria-busy={submitting}
      >
        {serverError && (
          <div
            className="qs-error-banner"
            role="alert"
            tabIndex={-1}
            ref={serverErrorRef}
          >
            {serverError}
          </div>
        )}
        <FormField
          id="login-email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={values.email}
          onChange={change}
          error={errors.email}
        />
        <FormField
          id="login-password"
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={values.password}
          onChange={change}
          error={errors.password}
        />
        <button
          type="submit"
          className="qs-primary-button"
          disabled={submitting}
        >
          <span>{submitting ? "Signing in…" : "Sign in"}</span>
          <Icon name="arrow" size={19} />
        </button>
      </form>
      <p className="qs-switch-copy">
        New to QueueSmart?{" "}
        <Link to="/register">
          Create an account <span aria-hidden="true">↗</span>
        </Link>
      </p>
      <div className="qs-demo-panel">
        <div className="qs-demo-heading">
          <span>TAKE A LOOK AROUND</span>
          <span>Demo access</span>
        </div>
        <div className="qs-demo-buttons">
          <button type="button" onClick={() => fillDemo("user")}>
            <Icon name="person" size={17} /> User demo{" "}
            <Icon name="arrow" size={16} />
          </button>
          <button type="button" onClick={() => fillDemo("admin")}>
            <Icon name="shield" size={17} /> Admin demo{" "}
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <p>
          Both demo passwords: <code>{DEMO_PASSWORD}</code>
        </p>
        <p className="qs-demo-status" role="status">
          {demoMessage || "Demo accounts reset when this page refreshes."}
        </p>
      </div>
    </>
  );
}
