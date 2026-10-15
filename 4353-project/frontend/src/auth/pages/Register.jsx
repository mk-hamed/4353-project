import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import Icon from "../components/Icon.jsx";
import { register } from "../services/authService.js";
import { validateRegistration } from "../utils/validation.js";

export default function Register() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const serverErrorRef = useRef(null);
  const [values, setValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "QueueSmart | Create account";
  }, []);
  useEffect(() => {
    if (serverError) serverErrorRef.current?.focus();
  }, [serverError]);

  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({
      ...current,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    setServerError("");
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      formRef.current.elements.namedItem(firstInvalid)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const user = await register(values);
      navigate("/login", {
        replace: true,
        state: { registered: true, email: user.email },
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
        <span className="qs-form-kicker">A BETTER WAY TO WAIT</span>
        <h2>Make time for more.</h2>
        <p>Create your account. We'll save you a spot.</p>
      </div>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Create account form"
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
          id="register-email"
          name="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          hint="This will be your username."
          value={values.email}
          onChange={change}
          error={errors.email}
        />
        <FormField
          id="register-password"
          name="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          hint="Use 8–128 characters."
          value={values.password}
          onChange={change}
          error={errors.password}
        />
        <FormField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="Enter your password again"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={change}
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          className="qs-primary-button"
          disabled={submitting}
        >
          <span>{submitting ? "Creating account…" : "Create account"}</span>
          <Icon name="arrow" size={19} />
        </button>
      </form>
      <p className="qs-switch-copy">
        Already have an account?{" "}
        <Link to="/login">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      </p>
      <p className="qs-register-note">
        <Icon name="person" size={17} />
        <span>
          A2 demo: new accounts are regular users and stay available until this
          page refreshes. Use a sample password.
        </span>
      </p>
    </>
  );
}
