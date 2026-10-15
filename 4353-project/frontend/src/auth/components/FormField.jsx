import React, { useState } from "react";
import Icon from "./Icon.jsx";

export default function FormField({
  id,
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = "text",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const description =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={`qs-field${error ? " qs-field-invalid" : ""}`}>
      <label htmlFor={id}>
        {label}
        <span className="qs-required" aria-hidden="true">
          *
        </span>
      </label>
      <div className="qs-input-wrap">
        <span className="qs-input-icon">
          <Icon name={isPassword ? "lock" : "mail"} size={19} />
        </span>
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required
          aria-invalid={!!error}
          aria-describedby={description}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className="qs-password-toggle"
            aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            <Icon name={visible ? "hidden" : "eye"} size={19} />
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="qs-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="qs-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
